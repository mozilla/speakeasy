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

module.exports = {
    run: run
};
