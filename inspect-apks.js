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

var apkIndex = 0;

scanNextFile();

function scanNextFile() {
    if(apkIndex < apks.length) {
        scanAPK(apks[apkIndex++]);
    }
}

function scanAPK(apkFile) {

    var zipPath = path.join(ZIPS_DIR, apkFile + '.zip');
    var fullPath = path.join('./captures', apkFile);

    console.log('APK', fullPath, zipPath);

    var rs = fs.createReadStream(fullPath);
    var ws = fs.createWriteStream(zipPath);

    ws.on('close', function() {
        console.log('done copying', zipPath);

        // some zips make node-unzip go nuts, so let's just use good
        // old binary unzip via exec
        /*fs.createReadStream(zipPath)
        .pipe(unzip.Parse())
            .on('entry', function(entry) {
                var filename = entry.path;
                //console.log(filename, entry);
                entry.autodrain();
            })
            .on('error', function(noidea) {
                console.log('ERROR', noidea);
            })
            .on('close', function() {
                console.log('end');
                process.exit(0);
            });*/

        var outDir = path.join(ZIPS_DIR, apkFile.replace('.apk', ''));

        exec('rm -Rf ' + outDir, function(error, stdout, stderr) {
            var cmd = 'unzip ' + zipPath + ' -d ' + outDir;
            console.log(cmd);
            exec(cmd, function(error, stdout, stderr) {
                console.log('unzip done');

                var tmpDir = path.join(outDir, 'TMP!!!');
                var classesDex = path.join(outDir, 'classes.dex');
                var classesTmpDex = path.join(tmpDir, 'classes.dex');
                var classesJar = path.join(tmpDir, 'classes-dex2jar.jar');
                var cwd = process.cwd();

                console.log('CWD', cwd);                

                cmd = [
                    'mkdir ' + tmpDir,
                    'cp ' + classesDex + ' ' + tmpDir,
                    'cd ' + tmpDir,
                    // converts .dex into .jar
                    'd2j-dex2jar.sh classes.dex',
                    // extracts the files inside the .jar
                    'jar xvf classes-dex2jar.jar',
                    'cd ' + cwd
                ].join('; ');

                console.log('EXECUTE->', cmd);

                exec(cmd, function(error, stdout, stderr) {

                    // actually scan stuff
                    detectHTML5ness(outDir, function(detectedTraits) {
                        // process.nextTick(scanNextFile);
                    });

                });

            });
        });

    });

    rs.pipe(ws);

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

