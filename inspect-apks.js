var fs = require('fs');
var path = require('path');
var unzip = require('unzip');
var exec = require('child_process').exec;

var apks = fs.readdirSync('./captures').filter(function(entry) {
    return entry.match('\\.apk$');
});

console.log(apks);
var ZIPS_DIR = './captures/zips';

if(!fs.existsSync(ZIPS_DIR)) {
    fs.mkdirSync(ZIPS_DIR);
}

var detectedTraits = {};
var apkIndex = 0;

scanNextFile();

function scanNextFile() {
    if(apkIndex < apks.length) {
        var apkFile = apks[apkIndex++];
        scanAPK(apkFile, function(resultTraits) {

            detectedTraits[ apkFile ] = resultTraits;

            process.nextTick(scanNextFile);

        });
    }
}

function scanAPK(apkFile, doneCallback) {
    
    var apkFullPath = path.join('./captures', apkFile);
    var zipPath = path.join(ZIPS_DIR, apkFile + '.zip');
    var extractDir = path.join(ZIPS_DIR, apkFile.replace('.apk', ''));
    var tmpDir = path.join(extractDir, 'TMP!!!');
    var classesDex = path.join(extractDir, 'classes.dex');
    var classesTmpDex = path.join(tmpDir, 'classes.dex');
    var classesJar = path.join(tmpDir, 'classes-dex2jar.jar');

    var cwd = process.cwd();

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

    var cmd = commands.join('; ');
    console.log('Full command', cmd);

    exec(cmd, function(error, stdout, stderr) {
        // We can now actually analyse the APK contents
        detectHTML5ness(extractDir, doneCallback);
    });
}


function filterHTMLfiles(f) {
    return f.match(/\.html?$/i);
}


function filterJSfiles(f) {
    return f.match(/\.js$/i);
}


function filterClassFiles(f) {
    return f.match(/\.class$/i);
}


function filterPhonegapiness(f) {
    var expressions = [
        /com\/phonegap/,
        /com\/sencha/,
        /org\/apache\/cordova/,
        /org\/appcelerator/
    ];

    return expressions.some(function(expression) {
        return f.match(expression);
    });
}


function detectHTML5ness(apkDir, doneCallback) {
    console.log('Guessing html5-ness in', apkDir);

    var apkFiles = recursiveDirList(apkDir);
    var traits = [];

    // Possible HTML5 tell-tale signs
    
    // presence of html files
    var htmlFiles = apkFiles.filter(filterHTMLfiles);

    if(htmlFiles.length) {
        
        // console.log('HTML files', htmlFiles);

        traits.push({
            amount: 5,
            reason: 'Presence of HTML files',
            files: htmlFiles
        });
    }


    // presence of js files
    var jsFiles = apkFiles.filter(filterJSfiles);

    if(jsFiles.length) {
        
        console.log('JS Files!!', jsFiles);

        traits.push({
            amount: 15,
            reason: 'Presence of JavaScript files',
            files: jsFiles
        });
    }

    // TODO webview calls?

    // classes.dex -> phonegap / ... / classes?
    var javaClasses = apkFiles.filter(filterClassFiles);
    var phonegapey = javaClasses.filter(filterPhonegapiness);

    if(phonegapey.length) {

        traits.push({
            amount: 50,
            reason: 'Presence of Phonegap or similar',
            files: phonegapey
        });

    }


    // TODO this calculation should be done outside
    var total = 0;
    traits.forEach(function(tr) {
        console.log('+ ', tr.amount, tr.reason);
        total += tr.amount;
    });
    console.log(total + ' TOTAL');

    doneCallback(traits);
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

