// This script requests downloading a single app
var LOGIN_URL = 'https://accounts.google.com/ServiceLogin';

var fs = require('fs');

var casper = require('casper').create({
    onWaitTimeout: function() {
        this.warn('Timeout for ' + this.getTitle() + '. Already installed?');
        this.done();
    }
});

var url = casper.cli.options.url;

try {
    var LOGIN_CREDENTIALS = JSON.parse(fs.read('google_account.json'));
} catch (e) {
    casper.die("Couldn't find Google Account credentials. Does google_account.json exist?");
}

casper.start(LOGIN_URL, function() {
    this.fill('#gaia_loginform', {
        Email: LOGIN_CREDENTIALS.email,
        Passwd: LOGIN_CREDENTIALS.password
    }, true);
});

casper.thenOpen(url, function() {
    this.echo('Attempting to install app from ' + url);
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
