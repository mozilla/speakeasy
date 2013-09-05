#!/bin/bash

phantomjs ./phantom-getTop100Free.js
# node ./findinslideme.js # optional if you're curious, we're not using this anymore
node ./batch-download.js
node ./inspect-apks.js
