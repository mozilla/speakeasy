
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
./run.sh
````

Or you can also run the individual scripts separately.

## Output

Things are downloaded/saved into `captures/`

Make sure the folder exists first ;-)
