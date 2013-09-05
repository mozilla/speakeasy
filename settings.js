var nconf = require('nconf');
var fs = require('fs');
var CONFIG_FILE = 'config.json';

nconf.argv().env();


if(fs.existsSync(CONFIG_FILE)) {
    nconf.file(CONFIG_FILE);
}

nconf.defaults({
    outputDir: 'captures'
});

// finally expose the config thingie
module.exports = nconf;
