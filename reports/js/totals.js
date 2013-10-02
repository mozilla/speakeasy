var globalData = {
    totals: [],
    categories: {}
};

window.onload = function() {
    loadJSONFiles([
        [ 'totals.json', onTotalsLoaded ],
        [ 'categories.json', onCategoriesLoaded ]
    ]);
};

function loadJSONFiles(filesList, doneCallback) {
    
    doneCallback = doneCallback || function() {};

    var filesIter = iterator(filesList);
    var loadNext = function() {

        var nextValue = filesIter.next();

        if(nextValue.done) {
            doneCallback();
        } else {
            var tuple = nextValue.value;
            var request = new XMLHttpRequest();
            var jsonURL = tuple[0];
            var jsonCallback = tuple[1];

            request.open('GET', jsonURL);
            request.responseType = 'text';
            request.onload = function() {

                console.log('loaded', jsonURL);

                var data = JSON.parse(request.response);

                if(jsonCallback) {
                    jsonCallback(data);
                }

                setTimeout(loadNext, 1);
            };

            request.send();
        }
    };

    loadNext();

}

function onTotalsLoaded(data) {
    console.log('totals loaded', data.length);
    globalData.totals = data;
}


function onCategoriesLoaded(data) {
    console.log('cats loaded', data.length);
    var catJSONs = data.map(function(d) {
        var name = d.split('/').pop();
        return [ 'category-' + name + '.json', function(catData) {
            onCategoryLoaded(name, catData);
        } ];
    });
    console.log(catJSONs);

    globalData.categories = {};

    loadJSONFiles(catJSONs, onAllDataLoaded);
    
}


function onCategoryLoaded(categoryName, data) {
    console.log('loaded category', categoryName);
    globalData.categories[categoryName] = data.map(function(d) {
        return d.split('=').pop();
    });
}

function* iterator(arr) {
    for(var i = 0; i < arr.length; i++) {
        yield arr[i];
    }
}

function onAllDataLoaded() {

    onDataLoaded(globalData.totals);
    makeCategorisedReport(globalData);

}

function onDataLoaded(data) {

    var totals = document.getElementById('totals');
    totals.innerHTML = '<p>' + data.length + ' apps</p>';

    makeGlobalReport('out', data.slice(0));
    makeAirReport('air', data.slice(0));

}


function makeGlobalReport(tableId, data) {

    data.sort(makeSorter('total'));

    var div = document.getElementById(tableId);
    var out = document.createElement('table');

    var groups = {
        yes: 0,
        maybe: 0,
        unlikely: 0,
        no: 0
    };

    data.forEach(function(app, appIndex) {
        var traits = app.traits;
        traits.sort(makeSorter('amount'));

        // Title
        var trTitle = out.insertRow(-1);
        trTitle.className = 'title';

        var tdCounter = trTitle.insertCell(-1);
        tdCounter.innerHTML = (appIndex + 1);

        // Build up the title:
        var title = app.info !== undefined ? app.info.title : app.name;

        var tdTotal = trTitle.insertCell(-1);
        tdTotal.innerHTML = app.total;

        var tdName = trTitle.insertCell(-1);
        tdName.innerHTML = '<h3><a href="#show-more">' + title + '</a></h3>';

        // Details
        
        var trDetails = out.insertRow(-1);
        trDetails.className = 'details';

        trDetails.insertCell(-1); // empty

        var tdDetails = trDetails.insertCell(-1);
        tdDetails.colSpan = 3;

        tdDetails.innerHTML = '<p>Play Store: <a href="' + getAppURL(app.name) + '" target="_blank" rel="noreferrer">' + app.name + '</a></p>';

        var traitsTable = document.createElement('table');
        traitsTable.className = 'traits';
        
        traits.forEach(function(trait) {

            var traitRow = traitsTable.insertRow(-1);
            var tdAmount = traitRow.insertCell(-1);
            var tdDesc = traitRow.insertCell(-1);

            tdAmount.innerHTML = trait.amount.toFixed(2);
            tdDesc.innerHTML = trait.reason;

            var hover = trait.files.join('\n');

            traitRow.title = hover;

        });

        tdDetails.appendChild(traitsTable);


        var total = app.total;
        
        var className = isHTML5(total);

        groups[className]++;

        trTitle.classList.add(className);
        trDetails.classList.add(className);

    });

    // summary - chart with % of html5 likeability
    appendPieChart('#' + div.id, groups);

    div.appendChild(out);

    $('#' + tableId + ' tr.title').on('click', function() {
        $(this).next().toggle();
        this.classList.toggle('open');
    });

}

function isHTML5(total) {

    var className = 'no';

    if(total > 50) {
        className = 'yes';
    } else if(total > 30) {
        className = 'maybe';
    } else if(total > 15) {
        className = 'unlikely';
    }

    return className;
}

function makeAirReport(containerId, data) {
    var airApps = data.filter(function(appInfo) {
        var airTraits = appInfo.traits.filter(function(trait) {
            if(trait.reason === 'air') {
                return trait;
            }
        });
        return airTraits.length > 0;
    });

    var container = document.getElementById(containerId);
    var percentage = (airApps.length * 100.0 / data.length).toFixed(2);

    container.innerHTML = '<p><strong>' + percentage + '%</strong> of ' + data.length + ' apps</p>';

    var list = document.createElement('ol');
    container.appendChild(list);

    airApps.sort(function(a, b) {
        return a.info.title.toLowerCase() > b.info.title.toLowerCase();
    });

    airApps.forEach(function(app) {
        var li = document.createElement('li'); 
        li.innerHTML = app.info.title + ' (<a href="' + getAppURL(app.name) + '">play store</a>)';
        list.appendChild(li);
    });
}

function makeCategorisedReport(data) {

    var categories = data.categories;
    var totals = data.totals;
    var categoryBreakdown = document.getElementById('category-breakdown')

    for(var catName in categories) {
        var catData = categories[catName];

        var appsInCategory = totals.filter(function(app) {
            var pkgName = app.name;
            return catData.indexOf(pkgName) !== -1; 
        });
        
        var numApps = appsInCategory.length;
        var groups = {};

        appsInCategory.forEach(function(app) {

            var total = app.total;
            var html5ness = isHTML5(total);

            if(groups[html5ness] === undefined) {
                groups[html5ness] = 0;
            } else {
                groups[html5ness]++;
            }

        });

        console.log(catName, numApps);

        var div = document.createElement('div');
        div.id = 'categoryBreakdown-' + catName;

        categoryBreakdown.appendChild(div);

        var h3 = document.createElement('h3');
        h3.innerHTML = catName + ' ' + numApps;
        div.appendChild(h3);

        appendPieChart('#' + div.id, groups);
        
    };
}

function getAppURL(packageName) {
    return 'https://play.google.com/store/apps/details?id=' + packageName;
}


function makeSorter(propertyName) {
    return function(a, b) {
        var propA = Number(a[propertyName]);
        var propB = Number(b[propertyName]);
        var epsilon = propA - propB;

        if(Math.abs(epsilon) < 0.0001) {
            return 0;
        } else {
            return epsilon > 0 ? -1 : 1;
        }
    };
}

function appendPieChart(selector, values) {
    console.log('appendPie', selector);
    console.log(values);

    var data = [];
    var totals = 0;
    for(var k in values) {
        data.push({ label: k, value: values[k] });
        totals += values[k];
    }

    var width = 300;
    var height = 300;

    var radius = Math.min(width, height) / 2;
    var percGraph = 0.5;
    var graphRadius = radius * percGraph;
    var w = width;
    var h = height;

    var color = d3.scale.category20c();
    var vis = d3.select(selector)
        .append("svg:svg")
            .data([data])
            .attr("width", w)
            .attr("height", h)
            .append("svg:g")
                .attr("transform", "translate(" + radius + "," + radius + ")");

    var arc = d3.svg.arc()
        .outerRadius(graphRadius);

    var pie = d3.layout.pie()
        .value(function(d) { return d.value; });

    var arcs = vis.selectAll('g.slice')
        .data(pie)
        .enter()
        .append('svg:g')
        .attr('class', 'slice');

    arcs.append('svg:path')
        .attr('fill', function(d, i) { return color(i); } )
        .attr('d', arc);

    arcs.append('svg:text')
        .attr('dy', '5px')
        .attr('transform', function(d) {
            var alpha = (d.endAngle - d.startAngle) * 0.5 + d.startAngle;
            var dist = radius * (percGraph + 0.05);
            return 'translate(' + ( dist * Math.sin( alpha ) ) + ',' + ( - dist * Math.cos( alpha ) ) + ') rotate(' + angle(d) + ')';
        })
        .style('text-anchor', function(d) {
            var rads = ((d.endAngle - d.startAngle) / 2) + d.startAngle;
            if(rads >= 0 && rads <= Math.PI) {
                return 'start';
            } else {
                return 'end';
            }
        })
        .text(function(d, i) { return Math.round(data[i].value * 100.0 / totals) + '% ' + data[i].label; });


    function angle(d) {
        var a = (d.startAngle + d.endAngle) * 90 / Math.PI - 90;
        return a > 90 ? a - 180 : a;
    }

}
