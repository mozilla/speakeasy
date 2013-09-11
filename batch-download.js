// Batch download apps to a device.
var fs = require('fs');
var path = require('path');
var url = require('url');
var settings = require('./settings');
var getPkgPath = require('./functions').getPkgPath;

var OUTDIR = settings.get('outputDir');
var URLS_FILE = settings.get('urlsJSON');
var APKS_DIR = path.join(OUTDIR, settings.get('apksDir'));

var urls = JSON.parse(fs.readFileSync(path.join(OUTDIR, URLS_FILE)));

var currentURLIndex = 0;
var sys = require('sys');
var exec = require('child_process').exec;
function puts(error, stdout, stderr) { sys.puts(stdout); }

console.log(urls.length + ' urls');

downloadNext();

function downloadNext(error, stdout, stderr) {

    if (stdout) {
        console.log(stdout);
    }

    if (currentURLIndex < urls.length) {
        
        
        var appURL = urls[currentURLIndex];
        currentURLIndex++;

        var parsed = url.parse(appURL, true);
        var pkgName = parsed.query.id;
        
        console.log('pkg name', pkgName);

        //getPkgPath(pkgName, function(pkgPath) {
            
/*            var appPath;

            if(pkgPath === false || pkgPath.length === 0) {
                filename = pkgName + '-1.apk';
            } else {
                filename = pkgPath.split('/').pop();
            }

            appPath = path.join(OUTDIR, settings.get('apksDir'), filename);
*/
            console.log(currentURLIndex, URLS_FILE, pkgName);

            if(apkExistsLocally(pkgName)) {

                console.log('already got that one, skipping');
                process.nextTick(downloadNext);

            } else {

                var randomTimeout = 100000 * Math.random();
            
                console.log('timeout ' + randomTimeout);

                setTimeout(function() {
                    exec('casperjs download.js --url=' + appURL, function(error, stdout, stderr) {
                        puts(error, stdout, stderr);
                        process.nextTick(downloadNext);
                    });
                }, randomTimeout);

            }

        //});

        /*var appPath = path.join(OUTDIR, settings.get('apksDir'), pkgName + '-1.apk');

        console.log(currentURLIndex, appPath);

        if(fs.existsSync(appPath)) {

            console.log('already got that one, skipping');
            process.nextTick(downloadNext);

        } else {

            var randomTimeout = 100000 * Math.random();
        
            console.log('timeout ' + randomTimeout);

            setTimeout(function() {
                exec('casperjs download.js --url=' + appURL, function(error, stdout, stderr) {
                    puts(error, stdout, stderr);
                    process.nextTick(downloadNext);
                });
            }, randomTimeout);

        }*/

    }

}


function apkExistsLocally(pkgName) {
    var apks = fs.readdirSync(APKS_DIR);
    var regexp = new RegExp('^' + pkgName);
    var exists = apks.some(function(f) {
        return regexp.test(f);
    });
    console.log('exists?', pkgName, exists);
    return exists;
}
