var util = require('util');
var spawn = require('child_process').spawn;
var fs = require('fs');
var settings = require('./settings');


// ensure the output dir exists
var outputDir = settings.get('outputDir');

if(!fs.existsSync(outputDir)) {
    fs.makeDirSync(outputDir);
}

var commands = [
    { cmd: 'phantomjs', args: ['./phantom-getTop100Free.js', '--num-apps=' + settings.get('numApps'), '--out-dir=' + settings.get('outputDir') ] },
    { cmd: 'node', args: ['./batch-download.js'] },
    { cmd: 'node', args: ['./apk-bck.js'] },
    { cmd: 'node', args: ['./inspect-apks.js'] }
];

var nextCommandIndex = 0;

executeNextCommand();


// ~~~

function executeNextCommand() {
    if(nextCommandIndex >= commands.length) {
        console.log('ALL DONE');
    } else {
        var nextCommand = commands[nextCommandIndex];
        console.log(nextCommand);
        run(nextCommand.cmd, nextCommand.args, function(code) {
            if(!code) {
                nextCommandIndex++;
                executeNextCommand();
            } else {
                console.error('There was an error with ' + nextCommand.cmd + ' error code ' + code);
                console.error('HALTING');

            }
    

        });
    }
}


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
