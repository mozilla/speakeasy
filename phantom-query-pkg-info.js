var args = require('system').args;
var page = require('webpage').create();
var fs = require('fs');

var URL;
var OUTDIR = './captures/appsInfo';
var OUTFILENAME;


function valueOf(argument) {
    var parts = argument.split('=');
    parts.shift();
    return parts.join('=');
}

if(args.length >= 1) {
    args.forEach(function(arg, i) {
       if(arg.match(/^--url=/)) {
           URL = valueOf(arg);
       } else if(arg.match(/^--output-dir=/)) {
            OUTDIR = valueOf(arg);
       } else if(arg.match(/^--output-file=/)) {
           OUTFILENAME = valueOf(arg);
       }
    });
}

if(URL === undefined) {
    console.error('A URL HAS TO BE SPECIFIED');
    phantom.exit();
}

if(OUTFILENAME === undefined) {
    var packageName = URL.split('/').pop().split('=').pop();
    console.log('pkg', packageName);
    OUTFILENAME = packageName + '.json';
}

console.log(URL, OUTDIR, OUTFILENAME);

var outFilePath = OUTDIR + '/' + OUTFILENAME;
console.log(outFilePath);

if(!fs.exists(outFilePath)) {

    page.open(URL, function(status) {

        if(status !== 'success') {
            console.log('ohh boo', status);
            phantom.exit();
        }

        var appInfo = page.evaluate(function() {

            var title = document.querySelector('.document-title').innerText.trim();
            var developer = document.querySelector('a[itemprop=name]').innerText.trim();
            var rating = document.querySelector('.current-rating').style.width.replace('%', '') + 0;
            var numRatings = document.querySelector('.stars-count').innerText.replace(/[^\d]/g, '');
            var numDownloadsRange = document.querySelector('div[itemprop=numDownloads]').innerText.trim();

            var data = {
                title: title,
                developer: developer,
                rating: rating,
                numRatings: numRatings,
                numDownloadsRange: numDownloadsRange
            };

            return data;

        });

        if(appInfo) {
            console.log('writing to ', outFilePath);
            fs.write(outFilePath, JSON.stringify(appInfo, null, 4));
        }

        phantom.exit();

    });
} else {
    console.log('already there');
    phantom.exit();
}

