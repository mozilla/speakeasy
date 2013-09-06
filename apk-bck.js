var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
var settings = require('./settings');

var packages;
var currentPackageIndex = 0;
var original_cwd = process.cwd();
var outDir = path.join(original_cwd, settings.get('outputDir'), settings.get('apksDir'));

console.log('apk-bck out dir=' + outDir);

if(!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
}

process.chdir(outDir);

exec('adb shell pm list packages', function(error, stdout, stderr) {
    

    if(error) {
        var errorMsg = error.toString();
        console.error(errorMsg);
        if(errorMsg.search('device not found')) {
            console.log('>>> hint hint: IS THE DEVICE CONNECTED TO THE COMPUTER?');
        }
    } else {

        packages = stdout.trim().split('\r\n');
        processNext();

    }

});

function processNext() {
    var pk = packages[currentPackageIndex];
    currentPackageIndex++;

    var f = pk.replace('package:', '');
    f = f + '-1.apk';

    console.log(f);

    if(fs.existsSync(f)) {

        console.log('\t=> already exists');
        nextStep();

    } else {

        exec('adb pull /data/app/' + f, function(er, sout, serr) {
            nextStep();
        });

    }
}

function nextStep() {
    if(currentPackageIndex < packages.length) {
        process.nextTick(processNext);
    } else {
        finish();
    }
}

function finish() {
    console.log('done');
    exec('cd ' + original_cwd);
}


