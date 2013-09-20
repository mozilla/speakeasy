// This script requests downloading a single app
var LOGIN_URL = 'https://accounts.google.com/ServiceLogin';

var fs = require('fs');

var casper = require('casper').create({
    //waitTimeout: 1000,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.65 Safari/537.36',
    onWaitTimeout: function() {
        this.warn('Timeout for ' + this.getTitle() + '. Already installed?');
        capture(this);
        this.exit();
    }
});

var url = casper.cli.options.url;

try {
    var LOGIN_CREDENTIALS = JSON.parse(fs.read('google_account.json'));
} catch (e) {
    casper.die("Couldn't find Google Account credentials. Does google_account.json exist?");
}

casper.start(LOGIN_URL, function() {
    this.echo('started');
    capture(this);
});

casper.waitForSelector('#gaia_loginform', function() {
    this.fill('#gaia_loginform', {
        Email: LOGIN_CREDENTIALS.email,
        Passwd: LOGIN_CREDENTIALS.password
    }, true);
});

casper.then(function() {
    capture(this);
});

casper.thenOpen(url, function() {
    capture(this);
    this.echo('Attempting to install app from ' + url);
});

casper.then(function() {
    capture(this);
});

casper.waitForSelector('.buy-button-container .buy', function() {
    this.click('.buy-button-container .buy');
});

casper.waitForSelector('#purchase-ok-button', function() {
    this.click('#purchase-ok-button');
});

casper.waitForSelector('.purchase-complete-container', function() {
    this.echo('Purchase complete!');
});

casper.run();

function capture(obj) {
    /*
    var title = obj.getTitle();
    var d = new Date();
    var outputFile = 'captures/000_screenshots/' + d.getTime() + '_' + (title.replace(/([^\w])+/g, '_')) + '.png';

    obj.warn('Capturing to ' + outputFile);
    obj.capture(outputFile, undefined, { format: 'png' });
    */
}
