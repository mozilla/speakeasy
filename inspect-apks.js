var fs = require('fs');
var path = require('path');
var unzip = require('unzip');
var exec = require('child_process').exec;
var settings = require('./settings');
var sequentialForEach = require('./functions').sequentialForEach;

var OUT_DIR = settings.get('outputDir');
var REPORTS_DIR = settings.get('reportsDir');
var APKS_DIR = path.join(OUT_DIR, settings.get('apksDir'));
var ZIPS_DIR = path.join(OUT_DIR, settings.get('zipsDir'));
var TRAITS_DIR = path.join(OUT_DIR, settings.get('traitsDir'));
var APPS_INFO_DIR = path.join(OUT_DIR, settings.get('appsInfoDir'));

var apks = fs.readdirSync(APKS_DIR).filter(function(entry) {
    return entry.match('\\.apk$');
});

[ZIPS_DIR, TRAITS_DIR].forEach(function(d) {
    if(!fs.existsSync(d)) {
        fs.mkdirSync(d);
    }
});

var detectedTraits = {};
var apkIndex = 0;

nextStep();

// ---

function scanNextFile() {

    var apkFile = apks[apkIndex];
    var traitsFile = path.join(TRAITS_DIR, apkFile.replace(/-(\d+)\.apk$/, '.json'));

    console.log('TRAITS FILE', traitsFile);
    
    apkIndex++;

    if(!fs.existsSync(traitsFile)) {
        
        console.log('Scanning ' + Math.round(apkIndex/apks.length*100.0).toFixed(2) +'%');
        console.log('Results will go to ' + traitsFile);

        scanAPK(apkFile, function(resultTraits) {

            fs.writeFileSync(traitsFile, JSON.stringify(resultTraits, null, 4));

            nextStep();

        });

    } else {

        console.log('Already have traits for ' + apkFile + ', so skipping');
        nextStep();
        
    }

}

function nextStep() {
    if(apkIndex < apks.length) {
        
        setImmediate(scanNextFile);

    } else {

        findTotals();

    }
}

function findTotals() {
    console.log('TIME TO TOTAL!');

    var totals = [];

    var traits = fs.readdirSync(TRAITS_DIR).filter(function(entry) {
        return entry.match('\\.json');
    });

    sequentialForEach(traits, function(traitFile, goOn) {

        var packageName = traitFile.replace('.json', '');
        var traitPath = path.join(TRAITS_DIR, traitFile);
        var infoPath = path.join(APPS_INFO_DIR, traitFile);
        var data = JSON.parse(fs.readFileSync(traitPath));

        console.log('INFO', infoPath);

        if(!fs.existsSync(infoPath)) {
            findAppInfo(packageName, function() {
                addEntry();
            });
        } else {
            addEntry();
        }

        function addEntry() {

            var appEntry = {
                name: packageName,
                traits: data
            };

            var info;

            try {
                info = JSON.parse(fs.readFileSync(infoPath));
                appEntry.info = info;
            } catch(e) { }

            var total = 0;
            console.log('###### ' + packageName + ' #######');
            data.forEach(function(tr) {
                console.log('+ ', tr.amount.toFixed(2), '\t', tr.reason);
                total += tr.amount;
            });

            appEntry.total = total.toFixed(2);

            console.log(total.toFixed(2) + ' TOTAL');
            console.log('\n---\n');

            totals.push(appEntry);

            process.nextTick(goOn);

        }

    }, function() {

        var jsonString = JSON.stringify(totals, null, 4);
        fs.writeFileSync(path.join(OUT_DIR, 'totals.json'), jsonString);
        fs.writeFileSync(path.join(REPORTS_DIR, 'totals.json'), jsonString);

    });

}

function findAppInfo(packageName, callback) {
    var url = 'https://play.google.com/store/apps/details?id=' + packageName;
    var outFile = packageName + '.json';
   
    console.log('find info for', packageName, url);
    exec("phantomjs phantom-query-pkg-info.js --url=" + url + " --output-file=" + outFile + " --output-dir=" + APPS_INFO_DIR, function(error, stdout, stderr) {
        console.log('done find app info', error);
        console.log(stdout);

        callback();
    });
}

function scanAPK(apkFile, doneCallback) {
    
    var cwd = process.cwd();   
    var apkFullPath = path.join(APKS_DIR, apkFile);
    var zipPath = path.join(ZIPS_DIR, apkFile + '.zip');
    var extractDir = path.join(ZIPS_DIR, apkFile.replace('.apk', ''));
    var tmpDir = path.join(extractDir, 'TMP!!!');
    var classesDex = path.join(extractDir, 'classes.dex');
    var classesTmpDex = path.join(tmpDir, 'classes.dex');
    var classesJar = path.join(tmpDir, 'classes-dex2jar.jar');
    var ddxDir = path.join(extractDir, 'ddx');
    var ddxBin = path.join(cwd, 'ddx1.26.jar');
    var commands = [];

    if(!fs.existsSync(extractDir)) {
        commands.push('cp ' + apkFullPath + ' ' + zipPath);
        commands.push('unzip ' + zipPath + ' -d ' + extractDir);
    }

    if(!fs.existsSync(tmpDir)) {
        commands.push('mkdir ' + tmpDir);
    }

    commands.push('cp ' + classesDex + ' ' + tmpDir);

    if(!fs.existsSync(classesJar)) {

        commands.push('cd ' + tmpDir);

        // converts .dex into .jar
        commands.push('d2j-dex2jar.sh classes.dex');

        // extracts the files inside the .jar
        commands.push('jar xvf classes-dex2jar.jar');
        commands.push('cd ' + cwd);

    }

    // dex dex
    if(!fs.existsSync(ddxDir)) {
        commands.push('mkdir ' + ddxDir);
        commands.push('cp ' + classesDex + ' ' + ddxDir);
        commands.push('cd ' + ddxDir);
        commands.push('java -jar ' + ddxBin + ' -d ' + 'ddx' + ' classes.dex');
        commands.push('cd ' + cwd);
    }

    var cmd = commands.join('; ');
    console.log('Full command', cmd);

    exec(cmd, function(error, stdout, stderr) {
        // We can now actually analyse the APK contents
        detectTraits(extractDir, doneCallback);
    });

}


function filterHTMLfiles(f) {
    return f.match(/\.html?$/i);
}


function filterJSfiles(f) {
    return f.match(/\.js$/i);
}


function filterSWFfiles(f) {
    return f.match(/\.swf$/i);
}


function filterClassFiles(f) {
    return f.match(/\.class$/i);
}


function filterJSFrameworkiness(f) {
    var expressions = [
        /com\/gameclosure/,
        /com\/ludei/,
        /com\/phonegap/,
        /com\/sencha/,
        /org\/apache\/cordova/,
        /org\/appcelerator/
    ];

    return expressions.some(function(expression) {
        return f.match(expression);
    });
}


function detectTraits(apkDir, doneCallback) {
    console.log('Guessing html5-ness in', apkDir);

    var apkFiles = recursiveDirList(apkDir);
    var traits = [];

    // Possible HTML5 tell-tale signs
    
    // presence of html files
    var htmlFiles = apkFiles.filter(filterHTMLfiles);

    if(htmlFiles.length) {
        traits.push({
            amount: 5,
            reason: 'HTML files found in code',
            files: htmlFiles
        });
    }

    // presence of js files
    var jsFiles = apkFiles.filter(filterJSfiles);

    if(jsFiles.length) {
        traits.push({
            amount: 0.1 * jsFiles.length, // 15
            reason: 'JavaScript files found in code',
            files: jsFiles
        });
    }

    // classes.dex -> phonegap / ... / classes?
    var javaClasses = apkFiles.filter(filterClassFiles);
    var jsframeworkey = javaClasses.filter(filterJSFrameworkiness);

    if(jsframeworkey.length) {
        traits.push({
            amount: 50,
            reason: 'JavaScript framework detected (Phonegap or similar)',
            files: jsframeworkey
        });
    }

    // Not exactly html5 but it might be interesting to find about Air apps too
    var swfFiles = apkFiles.filter(filterSWFfiles);
    if(swfFiles.length) {
        traits.push({
            amount: 0,
            reason: 'air',
            files: swfFiles
        });
    }

    // webview calls?
    // the uncompiled ddx sort-of-assembly files have some metadata
    // referring to calls to WebView-classes
    // So we'll increase the chances of this being a 'web' app each time
    // a file is using WebView or derived classes
    var ddxDir = path.join(apkDir, 'ddx');

    console.log(ddxDir);

    exec('grep -lr WebView ' + path.join(ddxDir, '*'), function(error, stdout, stderr) {

        var matches = stdout.split('\n');
        var num = matches.length;
        if(num) {
            traits.push({
                amount: num * 0.1,
                reason: num.toFixed(2) + ' calls to WebView',
                files: matches
            });
        }
        
        doneCallback(traits);

    });

}

function recursiveDirList(dir) {

    var results = [];
    var entries = fs.readdirSync(dir);

    entries.forEach(function(entry) {

        var fullPath = path.join(dir, entry);
        var stat = fs.statSync(fullPath);

        if(stat && stat.isDirectory()) {
            results = results.concat( recursiveDirList(fullPath) );
        } else {
            results.push(fullPath);
        }

    });

    return results;
}

