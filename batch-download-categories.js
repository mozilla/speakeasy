// Iterating through list of category files, requesting the download of apps in that category
var fs = require('fs');
var path = require('path');
var settings = require('./settings');
var run = require('./functions').run;
var sequentialForEach = require('./functions').sequentialForEach;
var OUTDIR = settings.get('outputDir');
var CATS_FILE = settings.get('categoriesJSON');

var urls = JSON.parse(fs.readFileSync(path.join(OUTDIR, CATS_FILE)));

var index = 0;


sequentialForEach(urls, function(url, goOn) {

    var catName = url.split('/').pop();
    var catFile = 'category-' + catName + '.json';
    var catFilePath = path.join(OUTDIR, catFile);

    console.log(catFile);

    // ensure file with categories top exists first
    if(!fs.existsSync(catFilePath)) {
        console.log('cat file missing', catFilePath);
        var baseURL = 'https://play.google.com/store/apps/category/' + catName;
        run('phantomjs', [
            './phantom-getTop100Free.js',
            '--num-apps=' + settings.get('numApps'),
            '--output-dir=' + settings.get('outputDir'),
            '--output-file=' + catFile,
            '--top-url=' + baseURL
        ], function(code) {
            goOn();
        }); 
    } else {
        console.log('MEEEOW!', catFilePath);
        goOn();
    }

    // request downloads in one side, apk-bck in another side

}, function() {
    console.log('sequential done');
});

