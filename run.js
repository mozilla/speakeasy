var util = require('util');
var spawn = require('child_process').spawn;
var fs = require('fs');
var settings = require('./settings');


// ensure the output dir exists
var outputDir = settings.get('outputDir');

if(!fs.existsSync(outputDir)) {
    fs.makeDirSync(outputDir);
}

/*
 * phantomjs ./phantom-getTop100Free.js
# node ./findinslideme.js # optional if you're curious, we're not using this anymore
node ./batch-download.js
node ./inspect-apks.js
*/

var commands = [
    { cmd: 'phantomjs', args: ['./phantom-getTop100Free.js', '--num-apps=' + settings.get('numApps'), '--out-dir=' + settings.get('outputDir') ] },
    //{ cmd: 'node', args: ['./batch-download.js'] }
    //{ cmd: 'ls', args: ['.'] }
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
