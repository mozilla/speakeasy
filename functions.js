var spawn = require('child_process').spawn;

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

module.exports = {
    run: run,
    sequentialForEach: sequentialForEach
};
