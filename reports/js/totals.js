var globalData = {
    totals: [],
    categories: {},
    permissions: []
};

window.onload = function() {
    loadJSONFiles([
        [ 'appsURLs.json', onMostPopularLoaded ],
        [ 'totals.json', onTotalsLoaded ],
        [ 'categories.json', onCategoriesLoaded ],
        [ 'permissions.json', onPermissionsLoaded ]
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


function onMostPopularLoaded(data) {
    console.log('most popular loaded', data.length);
    globalData.mostPopular = data;
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


function onPermissionsLoaded(data) {
    console.log('permissions loaded', data.length);
    globalData.permissions = data;
}


function* iterator(arr) {
    for(var i = 0; i < arr.length; i++) {
        yield arr[i];
    }
}


function onAllDataLoaded() {

    onDataLoaded(globalData.totals);
    makeCategorisedReport(globalData);
    makeMostPopularReport(globalData);
    makePermissionsReport(globalData.totals, 'permissions');
    makePermissionsPopularReport(globalData, 'permissions_popular');
    makePermissionsCordovaReport(globalData, 'permissions_cordova');
    
}


function onDataLoaded(data) {

    var totals = document.getElementById('totals');
    totals.innerHTML = '<p>' + data.length + ' apps</p>';

    makeGlobalReport('out', data.slice(0));
    makeAirReport('air', data.slice(0));

}


function makeGlobalReport(tableId, data) {

    data.sort(function(a, b) {
        return getAppHTML5Score(b) - getAppHTML5Score(a);
    });

    var div = document.getElementById(tableId);
    var out = document.createElement('table');

    var groups = {
        yes: 0,
        maybe: 0,
        unlikely: 0,
        no: 0
    };
    
    data.forEach(function(app, appIndex) {
        var traits = app.traits.html5.traits;
        traits.sort(makeSorter('amount'));

        // Title
        var trTitle = out.insertRow(-1);
        trTitle.className = 'title';

        var tdCounter = trTitle.insertCell(-1);
        tdCounter.innerHTML = (appIndex + 1);

        // Build up the title:
        var title = app.info !== undefined ? app.info.title : app.name;

        var tdTotal = trTitle.insertCell(-1);
        tdTotal.innerHTML = getAppHTML5Score(app);

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


        var total = getAppHTML5Score(app);
        
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


function makePermissionsReport(data, outId) {

    var outElement = document.getElementById(outId);
    var table = document.createElement('table');
    var permissions = {};
    var numApps = data.length;

    var internetPermissions = 0;

    outElement.appendChild(table);

    data.forEach(function(app) {

        if(app.permissions) {

            var dedupedPermissions = dedupArray(app.permissions);
        
            dedupedPermissions.forEach(function(perm) {
                
                var permName = perm.split('.').pop();

                if(permissions[permName]) {
                    permissions[permName]++;
                } else {
                    permissions[permName] = 1;
                }

            });
        }
    });

    var permissionsArray = [];

    for(var k in permissions) {
        permissionsArray.push({ permission: k, count: permissions[k] });
    }

    permissionsArray.sort(makeSorter('count'));
    permissionsArray.reverse();

    permissionsArray.forEach(function(perm, index) {
        var tr = table.insertRow(-1);
        tr.insertCell(-1).innerHTML = (index + 1);
        tr.insertCell(-1).innerHTML = perm.permission;
        tr.insertCell(-1).innerHTML = perm.count;
        tr.insertCell(-1).innerHTML = percentage(Math.min(1.0, perm.count / numApps));
    });

}

function makePermissionsPopularReport(data, outId) {
    
    var popularApps = getPopularApps(data);

    makePermissionsReport(popularApps, outId);

}


function makePermissionsCordovaReport(data, outId) {
    
    var apps = data.totals.filter(function(app) {
        if(getAppIsPhonegap(app)) {
            return true;
        }
    });

    makePermissionsReport(apps, outId);
}


function dedupArray(array) {
    var out = [];
    array.forEach(function(el) {
        if(out.indexOf(el) === -1) {
            out.push(el);
        }
    });
    return out;
}


function findApp(array, pkgName) {

    for(var i = 0; i < array.length; i++) {
        var app = array[i];
        if(app.name === pkgName) {
            return app;
        }
    }
    
    return null;

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


function isAir(appInfo) {
    var airTraits = appInfo.traits.html5.traits.filter(function(trait) {
        if(trait.reason === 'air') {
            return trait;
        }
    });
    return airTraits.length > 0;
}


function getAppTitle(app) {
    return(app.info && app.info.title ? app.info.title : app.name);
}


function getAppHTML5Score(app) {
    return app.traits.html5.total;
}


function getAppIsPhonegap(app) {
    var itIs = false;
    app.traits.html5.traits.forEach(function(trait) {
        if(trait.reason.match(/Phonegap/i)) {
            itIs = true;
        }
    });
    return itIs;
}


function getAppNDKSOTrait(app) {
    var trait = null;
    app.traits.ndk.traits.forEach(function(t) {
        if(t.reason.match(/compiled code/i) && t.amount > 0) {
            trait = t;
        }
    });
    return trait;
}

function getAppUsesSO(app) {
    return getAppNDKSOTrait(app) !== null;
}


function getAppSOFileList(app) {
    var soTrait = getAppNDKSOTrait(app);
    var files = [];
    
    if(soTrait) {
        files = soTrait.files.map(function(f) {
            var fileName = f.split('/').pop();
            return fileName;
        });
    }


    // Return unique names, as sometimes the library has different versions
    // for different chipsets
    return uniqueArray(files);
}


function uniqueArray(arr) {
    var copy = arr.slice(0);
    var out = [];
    copy.sort();

    copy.forEach(function(f) {
        if(out.indexOf(f) === -1) {
            out.push(f);
        }
    });

    return out;

}


function findWebAPIPermissionByAndroidName(name) {
    var perm = null;
    var permissions = globalData.permissions;
    for(var i = 0; i < permissions.length; i++) {
        var p = permissions[i];
        if(p.android && p.android === name) {
            return p;
        }
    }
    return perm;
}


function renderPermissionsList(app) {
    var uniquePermissions = uniqueArray(app.permissions);
    var permList = uniquePermissions.map(function(p) {
        var shorterName = p.split('.').pop();
        var webAPIPermission = findWebAPIPermissionByAndroidName(shorterName);
        return { name: shorterName, webAPI: webAPIPermission };
    });

    var html = '<ul class="permissions">';

    permList.forEach(function(p) {
        var li = '<li';
        if(p.webAPI === null) {
            li += ' class="missing"';
        }
        li += '>' + p.name + '</li>';
        html += li;
    });

    html += '</ul>';

    return html;
}


// Converts a decimal value into xy.zz% output
function percentage(value) {
    return ((Math.round(value * 10000.0) / 100).toFixed(2)) + '%';
}


function makeAirReport(containerId, data) {
    var airApps = data.filter(isAir);

    var container = document.getElementById(containerId);

    container.innerHTML = '<p><strong>' + percentage(airApps.length / data.length) + '</strong> of ' + data.length + ' apps</p>';

    var list = document.createElement('ol');
    container.appendChild(list);

    airApps.sort(function(a, b) {

        var titleA = getAppTitle(a);
        var titleB = getAppTitle(b);

        return titleA.toLowerCase() > titleB.toLowerCase();

    });

    airApps.forEach(function(app) {
        var li = document.createElement('li'); 
        li.innerHTML = getAppTitle(app) + ' (<a href="' + getAppURL(app.name) + '">play store</a>)';
        list.appendChild(li);
    });
}


function getPopularApps(data) {

    var apps = [];
    var popular = data.mostPopular;
    var totalApps = data.totals;

    popular.forEach(function(appUrl) {
        var pkgName = getAppPackageName(appUrl);
        var app = findApp(totalApps, pkgName);

        if(app !== null) {
            apps.push(app);
        }
    });

    return apps;

}


function makeMostPopularReport(data) {

    var outElement = document.getElementById('popular');
    var overview = document.createElement('div');
    var table = document.createElement('table');
    var popular = getPopularApps(data);
    var numPopularApps = popular.length;
    var totalApps = data.totals;
    var aggregate = {};
    var airAmount = 0;
    var soAmount = 0;

    outElement.appendChild(overview);
    outElement.appendChild(table);

    var trHead = table.insertRow(-1);
    trHead.innerHTML = '<td></td><td>html5?</td><td>air?</td><td>.so?</td><td></td>';
    
    popular.forEach(function(app) {

        var tr = table.insertRow(-1);

        var tdTitle = tr.insertCell(-1);
        var appTitle = getAppTitle(app);
        var appURL = getAppURL(app.name);

        tdTitle.innerHTML = '<a href="' + appURL + '" rel="noreferrer">' + appTitle + '</a>';

        var tdHTML5ness = tr.insertCell(-1);
        var html5ness = isHTML5(getAppHTML5Score(app));
        tdHTML5ness.innerHTML = html5ness;

        if(aggregate[html5ness] === undefined) {
            aggregate[html5ness] = 1;
        } else {
            aggregate[html5ness]++;
        }

        var airness = tr.insertCell(-1);
        var air = isAir(app);
        airness.innerHTML = air ? 'AIR' : '';
        
        if(air) {
            airAmount++;
        }

        var tdSO = tr.insertCell(-1);
        var tdSOList = tr.insertCell(-1);
        var usesSO = getAppUsesSO(app);

        tdSO.innerHTML = usesSO ? '.SO' : '';
        if(usesSO) {
            soAmount++;
            tdSOList.className = 'lists';
            tdSOList.innerHTML = getAppSOFileList(app).join(', ');
        }

        
        var tdPermissions = tr.insertCell(-1);
        tdPermissions.className = 'lists';
        tdPermissions.innerHTML = renderPermissionsList(app);

    });

    var txtOverview = '<p>' + numPopularApps + ' apps' + '</p>';

    for(var k in aggregate) {
        var value = aggregate[k];
        txtOverview += '<p>' + k + ' ' + percentage(value / numPopularApps) + ' (' + value + ')</p>';
    }

    overview.innerHTML = txtOverview + '<br /><p>air: ' + airAmount + ' (' + percentage(airAmount / numPopularApps) + ')</p><p>using native .SO code: ' + soAmount + ' (' + percentage(soAmount / numPopularApps) + ')</p>';


}


function makeCategorisedReport(data) {

    var categories = data.categories;
    var totals = data.totals;
    var categoryBreakdown = document.getElementById('category-breakdown');
    var outputTable = document.createElement('table');
    var results = [];
    var keys = [ 'yes', 'maybe', 'unlikely', 'no' ];


    categoryBreakdown.appendChild(outputTable);

    for(var catName in categories) {

        var catData = categories[catName];
        var groups = {};
        var airness = 0;
        var yesApps = [];

        var appsInCategory = totals.filter(function(app) {
            var pkgName = app.name;
            return catData.indexOf(pkgName) !== -1; 
        });
        
        var numApps = appsInCategory.length;

        // Count how many apps fall in each 'html5 likeability' group
        appsInCategory.forEach(function(app) {

            var total = getAppHTML5Score(app);
            var html5ness = isHTML5(total);

            if(groups[html5ness] === undefined) {
                groups[html5ness] = 1;
            } else {
                groups[html5ness]++;
            }

            if(isAir(app)) {
                airness++;
            }

            if(html5ness === 'yes') {
                yesApps.push(app);
            }

        });

        var div = document.createElement('div');
        div.id = 'categoryBreakdown-' + catName;

        categoryBreakdown.appendChild(div);

        var h3 = document.createElement('h3');
        h3.innerHTML = catName + ' ' + numApps;
        div.appendChild(h3);

        appendPieChart('#' + div.id, groups);

        var numYes = groups.yes !== undefined ? groups.yes : 0;
        var yesPerc = percentage(numYes / appsInCategory.length);
        var airPerc = percentage(airness / appsInCategory.length);

        results.push({ name: catName, groups: groups, yesPerc: yesPerc, air: airness, airPerc: airPerc, count: appsInCategory.length, yesPackages: yesApps.map(function(app) {
            return app.name;
        }).join('<br />') });
        
    };

    results.sort(function(a, b) {

        var yesA = a.yesPerc;
        var yesB = b.yesPerc;

        return yesB - yesA;

    });

    
    var tr = outputTable.insertRow(-1);
    keys.forEach(function(k) {
        var cell = tr.insertCell(-1);
        cell.innerHTML = k;
    });

    tr.insertCell(-1).innerHTML = 'yes %';
    tr.insertCell(-1).innerHTML = '# apps';
    tr.insertCell(-1).innerHTML = '# air';
    tr.insertCell(-1).innerHTML = '% air';

    results.forEach(function(r) {

        var row = outputTable.insertRow(-1);
        
        keys.forEach(function(k) {
            var cell = row.insertCell(-1);
            var value = r.groups[k];

            if(value === undefined) {
                value = 0;
            }

            cell.innerHTML = value;
        });

        row.insertCell(-1).innerHTML = r.yesPerc;
        row.insertCell(-1).innerHTML = r.count;

        row.insertCell(-1).innerHTML = r.air;
        row.insertCell(-1).innerHTML = r.airPerc;

        row.insertCell(-1).innerHTML = r.name;

        row.insertCell(-1).innerHTML = '<div>' + r.yesPackages + '</div>';

    });
}

function getAppURL(packageName) {
    return 'https://play.google.com/store/apps/details?id=' + packageName;
}

function getAppPackageName(url) {
    return url.split('=').pop();
}


function makeSorter(propertyName) {
    return function(a, b) {
        var propA = Number(a[propertyName]);
        var propB = Number(b[propertyName]);
        
        return propA - propB;
    };
}

function appendPieChart(selector, values) {

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

    var color = {
        'yes': '#00aa00',
        'maybe': '#eeff00',
        'unlikely': '#dd9900',
        'no': '#ff0000'
    };

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
        .attr('fill', function(d, i) { var label = data[i].label; return color[label]; } )
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
        .text(function(d, i) { return percentage(data[i].value / totals) + data[i].label; });


    function angle(d) {
        var a = (d.startAngle + d.endAngle) * 90 / Math.PI - 90;
        return a > 90 ? a - 180 : a;
    }

}


