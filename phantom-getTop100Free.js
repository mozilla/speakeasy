var args = require('system').args;
var page = require('webpage').create();

var NUM_APPS = 100;
var OUTDIR = './captures';
var OUTFILENAME = 'appsURLs.json';
var TOP_URL =  'https://play.google.com/store/apps/collection/topselling_free';

function valueOf(argument) {
    return argument.split('=')[1];
}

if(args.length >= 1) {
    args.forEach(function(arg, i) {
       if(arg.match(/^--num-apps=/)) {
           NUM_APPS = valueOf(arg);
       } else if(arg.match(/^--output-dir=/)) {
            OUTDIR = valueOf(arg);
       } else if(arg.match(/^--top-url=/)) {
           TOP_URL = valueOf(arg);
       } else if(arg.match(/^--output-file=/)) {
           OUTFILENAME = valueOf(arg);
       }
    });
}

console.log('reading from', TOP_URL);
console.log('using out dir', OUTDIR);
var OUTFILE = OUTDIR + '/' + OUTFILENAME;
console.log('output', OUTFILE);


// Fake out our user agent, we're Chrome 28 now
page.settings.userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1500.95 Safari/537.36";

page.viewportSize = { width: 1024, height: 768 };
page.clipRect = { top: 0, left: 0, width: 1024, height: 768 };

page.onConsoleMessage = function(msg) {
    console.log("CONSOLE>", msg);
};

page.onResourceRequested = function(request) {
    console.log('REQUEST ' + request.url);
};


page.open(TOP_URL, function(status) {

    if(status !== 'success') {
        console.log('ohh boo', status);
        phantom.exit();
    }

    var scrollAttempts = 0;
    var previousScroll = 0;

    window.setInterval(function() {

        var links = page.evaluate(function() {

            var list = document.querySelectorAll('a');
            var out = [];

            for(var i = 0; i < list.length; i++) {
                var link = list[i].href;
                out.push(link);
            }

            return out;

        });


        var numLinks = links.length;

        console.log('num links', numLinks);
                
        var appLinks = Array.prototype.slice.call(links).filter(filterAppLink);
        var appsURLs = [];
        appLinks.forEach(function(link) {
            if(appsURLs.indexOf(link) === -1) {
                appsURLs.push(link);
            }
        });

        console.log('have', appsURLs.length);

        if(appsURLs.length >= NUM_APPS || scrollAttempts > 5) {
            console.log('HAVE', appsURLs.length, 'app URLs');

            if(appsURLs.length < NUM_APPS) {
                console.log('we might have given up :-/');
            }

            var fs = require('fs');
            fs.write(OUTFILE, JSON.stringify(appsURLs, null, 4));

            phantom.exit();
        }

        // This is so incredibly convoluted...
        var actualScroll = page.evaluate(function() {

            var currScroll = window.document.body.scrollTop;
            var newScroll = currScroll + 800;
            console.log(currScroll, '=>', newScroll);
            window.document.body.scrollTop = newScroll;
            // window.document.body.scrollTop = document.body.scrollHeight;
            console.log('actual?', window.document.body.scrollTop);

            if(window.document.body.scrollTop < newScroll) {
                // scrolling is not enough, sometimes
                var more = window.document.getElementById('show-more-button');
                if(more) {
                    more.click();
                }
                console.log('MOAAAAR');
            }

            return window.document.body.scrollTop;

        });

        if(previousScroll === actualScroll) {
            console.log('another attempt', scrollAttempts, previousScroll, actualScroll);
            scrollAttempts++;
        } else {
            scrollAttempts = 0;
        }

        previousScroll = actualScroll;

        page.scrollPosition = { top: actualScroll, left: 0 };
        //page.render(OUTDIR + '/' + Date.now() + '-' + actualScroll + '.png');


    }, 5000 + Math.random() * 10);
});


function getQuery(url) {

    var query = {};
    if(url.indexOf('?') === -1) {
        return query;
    }

    var parts = url.split('?');
     
    if(parts.length > 1) {
        var queryStr = parts[1];

        var pairsStr = queryStr.split('&');

        pairsStr.forEach(function(pairStr) {
            var pair = pairStr.split('=');
            var key = pair[0];
            var value = pair.length > 1 ? pair[1] : true;

            query[key] = value;
        });
    }
   
    return query;

}

function filterAppLink(link) {

    var linksRe = /^https:\/\/play\.google\.com\/store\/apps\/details/;
    var query = getQuery(link);
    var match = linksRe.exec(link);

    if(match && query.id) {

        return true;
    }

    return false;

}

