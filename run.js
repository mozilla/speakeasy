"use strict";

var util = require('util');
var fs = require('fs');
var path = require('path');
var settings = require('./settings');
var run = require('./functions').run;

// ensure the output dir exists
var outputDir = settings.get('outputDir');
var appsInfoDir = path.join(outputDir, settings.get('appsInfoDir'));

[outputDir, appsInfoDir].forEach(function(d) {
    if (!fs.existsSync(d)) {
        fs.mkdirSync(d);
    }
});

var commands = [
    {
        info: "Create files and folders.",
        cmd: 'touch',
        args: [
            path.join(outputDir, settings.get('urlsJSON'))
        ]
    },
    {
        info: "Create files and folders.",
        cmd: 'touch',
        args: [
            path.join(outputDir, 'apks')
        ]
    },
    {
        info: "Get free apps and store their URLs in JSON.",
        cmd: 'phantomjs',
        args: [
            './phantom-getTop100Free.js',
            '--num-apps=' + settings.get('numApps')
        ]
    },
    {
        info: "Find category info.",
        cmd: 'phantomjs',
        args: [
            './find-categories.js'
        ]
    },
    {
        info: "Download APKs to device.",
        cmd: 'node',
        args: [
            './batch-download.js'
        ]
    },
    {
        info: "Copy APKs from device.",
        cmd: 'node',
        args: [
            './apk-bck.js'
        ]
    },
    {
        info: "Inspect APKs and generate report.",
        cmd: 'node',
        args: [
            './inspect-apks.js'
        ]
    }
];

function executeCommand(index) {
    if (index >= commands.length) {
        console.log('ALL DONE');
    } else {
        var commandToRun = commands[index];

        console.log(commandToRun.info);

        run(commandToRun.cmd, commandToRun.args, function(code) {
            if (!code) {
                executeCommand(index + 1);
            } else {
                console.error('There was an error with: ' + commandToRun.cmd)
                console.error('Error code: ' + code);
            }
        });
    }
}

executeCommand(0);
