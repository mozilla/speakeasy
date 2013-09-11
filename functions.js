var spawn = require('child_process').spawn;
var exec = require('child_process').exec;

function run(command, args, endCallback) {
    
    if(!args) {
        args = [];
    }

    var spawned = spawn(command, args);

    spawned.stdout.on('data', function(data) {
        console.log('OUT> ' + data);
    });
    
    spawned.stderr.on('data', function(data) {
        console.log('ERR> ' + data);
    });

    spawned.on('exit', endCallback);

}

function sequentialForEach(array, funct, doneCallback) {

    var index = 0;

    function iterateNext() {

        if(index >= array.length) {
            process.nextTick(doneCallback);
        } else {
            var item = array[index];
            index++;

            funct(item, function() {
                process.nextTick(iterateNext);
            });

        }

    }

    iterateNext();

}

function getPkgPath(pkg, doneCallback) {
    exec('adb shell pm path ' + pkg, function(error, stdout, stderr) {
        if(error) {
            doneCallback(false);
        } else {
            output = stdout.trim();
            doneCallback(output);
        }
    });
}

module.exports = {
    run: run,
    sequentialForEach: sequentialForEach,
    getPkgPath: getPkgPath
};
