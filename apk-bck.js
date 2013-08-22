var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');

var packages;
var currentPackageIndex = 0;
var original_cwd = process.cwd();
var outDir = path.join(original_cwd, 'captures', 'apks');

if(!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
}

process.chdir(outDir);

exec('adb shell pm list packages', function(error, stdout, stderr) {
    
    packages = stdout.split('\r\n');

    processNext();

});

function processNext() {
    var pk = packages[currentPackageIndex];

    console.log('this', pk);

    var f = pk.replace('package:', '');
    f = f + '-1.apk';

    console.log('pull', f);

    exec('adb pull /data/app/' + f, function(er, sout, serr) {

        currentPackageIndex++;

        if(currentPackageIndex < packages.length) {
            process.nextTick(processNext);
        } else {
            finish();
        }
    });
}

function finish() {
    console.log('done');
    exec('cd ' + original_cwd);
}


