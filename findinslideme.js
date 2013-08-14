var fs = require('fs');
var url = require('url');
var http = require('http');
var httpget = require('http-get');

var TOP100FREE = './data_scraped/top100-appsURLs.json';
var DOMAIN = 'http://slideme.org';

var links = JSON.parse(fs.readFileSync(TOP100FREE));
var linkIndex = 0;

searchNextLink();

// ~~~

function searchNextLink() {
    
    if(linkIndex >= links.length) {

        console.log('done');

    } else {

        var link = links[linkIndex];
        var parsed = url.parse(link, true);
        var appId = parsed.query.id;
        
        linkIndex++;


        getPage(DOMAIN + '/applications/' + appId, function(html) {

            fs.writeFileSync('captures/search-' + appId + '.html', html);

            if(html.match('No mobile applications found in this category')) {
                // Nope :-(
                console.log(link, "not in slide me");
                searchNextLinkSometime();
            } else {
                // Find link to app result
                console.log("YAY", link);

                var firstResultRe = new RegExp('<h2 class="title"><a href="(.*?)"><span class="icon">', 'gim');
                var match = firstResultRe.exec(html);
                //console.log(match);

                if(match.length > 1) {
                    var appPageURL = DOMAIN + match[1];
                    grabApp(appPageURL, appId, searchNextLinkSometime);
                }
            }

        });

    }
}

function searchNextLinkSometime() {
    var timeout = (1 + Math.random()) * 5000;
    console.log('next link in', timeout);
    setTimeout(searchNextLink, timeout);
}

function grabApp(appPageURL, id, callback) {
    
    getPage(appPageURL, function(html) {

        var downloadRe = new RegExp('<div class="download-button"><a href="(.+?)" title="', 'gim');
        var match = downloadRe.exec(html);

        if(match && match.length > 1) {
            downloadLink = DOMAIN + match[1];
            
            var outputFile = 'captures/' + id + '.apk';

            if(fs.existsSync(outputFile)) {
                console.log(outputFile, 'already exists');
                callback();
            } else {
                console.log('downloading APK ->', downloadLink);
                httpget.get(downloadLink, outputFile, function(error, result) {
                    if(error) {
                        console.log('kk downloading', error);
                    } else {
                        console.log('file is at', outputFile);
                        callback();
                    }
                });
            }
        }

    });

}

function getPage(url, readyCallback) {

    console.log('GET PAGE>>>>', url);

    var req = http.request(url, function(response) {
        
        var str = '';

        response.on('data', function(chunk) {
            str += chunk;
        });

        response.on('end', function() {
            process.nextTick(function() {
                readyCallback(str);
            });
        });
    });

    req.end();

}

