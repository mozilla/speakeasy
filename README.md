## Install dependencies

Please satisfy the dependencies first: node.js, casperjs, phantomjs. A way of doing this in Mac could be:


````bash
brew install node
brew install casperjs
brew install phantomjs
````

(this requires that you have [Homebrew](http://brew.sh/) installed first)

It might be different if you're using Linux or Windows, or if you install the packages by downloading the binaries from their respective websites.

Now cd to the folder and run

````bash
npm install
````

so that the node.js dependencies are installed.

There are additional external dependencies that have to be installed manually:

* Java SDK to run Java tools
* `dex2jar` https://code.google.com/p/dex2jar/ - download and add its directory to your $PATH
* `dedexer` http://dedexer.sourceforge.net/ - download and place ddx1.26.jar in the root of this project

## Running

Just run:

````bash
node run.js
````

Or you can also run the individual scripts separately, as long as the previous script has already been ran once and the corresponding data has been gathered. For example, you can run the script that inspects apps at any time, but it makes no sense to do so before you have apps to inspect!

## Output

Things are downloaded/saved into `captures/`

If the folder doesn't exist, it will be automatically created.
