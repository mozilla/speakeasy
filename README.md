
## Install dependencies

````bash
brew install phantomjs
npm install
````

External/manual dependencies:

* Java SDK to run Java tools
* dex2jar https://code.google.com/p/dex2jar/ - download and add its directory to your $PATH
* dedexer http://dedexer.sourceforge.net/ - download and place it in the root of this project

## Running

the order should probably be

* phantomjs phantom-getTop100Free.js
* node findinslideme.js
* node inspect-apks.js

(make a bash script?)

## Output

Things are downloaded/saved into captures/

Make sure the folder exists first ;-)
