var URL = 'https://play.google.com/store/apps';
var OUTDIR = './captures/';
var OUTFILE = OUTDIR + 'categories.json';

var page = require('webpage').create();

page.open(URL, function(status) {

    if(status !== 'success') {
        console.log('ohh boo', status);
        phantom.exit();
    }

    var links = page.evaluate(function() {

        var list = document.querySelectorAll('a');
        var out = [];

        for(var i = 0; i < list.length; i++) {
            var link = list[i].href;
            out.push(link);
        }

        return out;

    });

    var catLinks = Array.prototype.slice.call(links).filter(filterCatLink);
    var urls = [];

    catLinks.forEach(function(link) {
        if(urls.indexOf(link) === -1) {
            urls.push(link);
        }
    });

    console.log(catLinks);

    var fs = require('fs');
    fs.write(OUTFILE, JSON.stringify(urls, null, 4));


    phantom.exit();



});


function filterCatLink(link) {

    var linksRe = /store\/apps\/category\/.*?$/;
    var match = linksRe.exec(link);

    if(match) {

        return true;
    }

    return false;

}

