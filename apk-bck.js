var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
var settings = require('./settings');

var packages;
var currentPackageIndex = 0;
var original_cwd = process.cwd();
var outDir = path.join(original_cwd, settings.get('outputDir'), settings.get('apksDir'));
var uninstallAfterBck = settings.get('uninstall');

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

    pk = pk.replace('package:', '');

    getPckPath(pk, function(devicePath) {
        if(devicePath === false) {
            nextStep();
        } else {
            devicePath = devicePath.replace('package:', '');
            var f = devicePath.split('/').pop();
            
            console.log(f);
    
            if(!fs.existsSync(f)) {
                console.log('on it...');
                exec('adb pull /data/app/' + f, function(er, sout, serr) {
                    if(er) {
                        console.log(er);
                    }
                    uninstallAndNext(pk, f);
                });
            } else {
                console.log('\t=> already exists');
                uninstallAndNext(pk, f);
            }

        }
    });
    
}

function getPckPath(pkg, doneCallback) {
    exec('adb shell pm path ' + pkg, function(error, stdout, stderr) {
        if(error) {
            doneCallback(false);
        } else {
            output = stdout.trim();
            doneCallback(output);
        }
    });
}

function uninstall(pkgName, doneCallback) {
    console.log('uninstalling -> ', pkgName);
    exec('adb uninstall ' + pkgName, function(er, sout, serr) {
        console.log('uninstall output', sout);
        doneCallback();
    });
}

function uninstallAndNext(pkg, localPkgPath) {
    if(uninstallAfterBck && fs.existsSync(localPkgPath)) {
        uninstall(pkg, nextStep);
    } else {
        nextStep();
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


