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

                // TODO actually scan stuff

                scanNextFile();
            });
        });

    });

    rs.pipe(ws);

}


