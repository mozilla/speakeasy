var util = require('util');
var fs = require('fs');
var path = require('path');
var settings = require('./settings');
var run = require('./functions').run;

// ensure the output dir exists
var outputDir = settings.get('outputDir');
var appsInfoDir = path.join(outputDir, settings.get('appsInfoDir'));

[outputDir, appsInfoDir].forEach(function(d) {
    if(!fs.existsSync(d)) {
        fs.mkdirSync(d);
    }
});

var commands = [
    { cmd: 'phantomjs', args: ['./phantom-getTop100Free.js', '--num-apps=' + settings.get('numApps'), '--output-dir=' + settings.get('outputDir'), '--output-file=' + settings.get('appsJSON') ] },
    { cmd: 'phantomjs', args: ['./find-categories.js'] },
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

