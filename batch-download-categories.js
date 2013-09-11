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

urls.sort();
console.log(urls);

sequentialForEach(urls, function(url, goOn) {

    var catFile = makeCategoryFileName(url);
    var catName = getCategoryName(url);
    var catFilePath = path.join(OUTDIR, catFile);

    console.log(catFile);

    // ensure file with categories top exists first
    if(!fs.existsSync(catFilePath)) {
        console.log('cat file missing', catFilePath);
        var baseURL = 'https://play.google.com/store/apps/category/' + catName + '/collection/topselling_free';
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

}, function() {
    console.log('sequential done');
    iterateCategories();
});


function getCategoryName(url) {
    return url.split('/').pop();
}

function makeCategoryFileName(url) {
    var catFile = 'category-' + getCategoryName(url) + '.json';
    return catFile;
}

function iterateCategories() {
    // request downloads in one side, apk-bck in another side
    
    sequentialForEach(urls, function(url, goOn) {


        console.log('Going to investigate', url);
        console.log('Remember to back up in another tab, or something');

        var urlsFile = makeCategoryFileName(url);

        run('node', [
            'batch-download.js',
            '--urlsJSON=' + urlsFile
        ], goOn);

    }, function() {
        console.log('boom! and bye');
    });

}

