#!/bin/bash

phantomjs ./phantom-getTop100Free.js
node ./findinslideme.js
node ./inspect-apks.js
