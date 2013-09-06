// Batch download apps to a device.
var fs = require('fs');
var path = require('path');
var url = require('url');
var settings = require('./settings');
var OUTDIR = settings.get('outputDir');

var urls = JSON.parse(fs.readFileSync(path.join(OUTDIR, 'appsURLs.json')));

var currentURLIndex = 0;
var sys = require('sys');
var exec = require('child_process').exec;
function puts(error, stdout, stderr) { sys.puts(stdout); }

console.log(urls.length + 'urls');

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
        var appPath = path.join(OUTDIR, settings.get('apksDir'), pkgName + '-1.apk');

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

        }

    }

}
