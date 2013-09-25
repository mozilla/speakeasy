var request = new XMLHttpRequest();

request.open('GET', 'totals.json', true);
request.responseType = 'text';
request.onload = function() {
    try {
        var data = request.response;
        var json = JSON.parse(data);
        onDataLoaded(json);
    } catch(e) {
        console.log('booo when loading data', e);
    }
};

request.send();

function onDataLoaded(data) {

    //makeGlobalReport('out', data.slice(0));
    makeAirReport('air', data.slice(0));

}

function makeGlobalReport(tableId, data) {

    data.sort(makeSorter('total'));

    var out = document.getElementById(tableId);

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
        var className = 'no';
        if(total > 50) {
            className = 'yes';
        } else if(total > 30) {
            className = 'maybe';
        } else if(total > 15) {
            className = 'unlikely';
        }

        trTitle.classList.add(className);
        trDetails.classList.add(className);

    });

    $('#' + tableId + ' tr.title').on('click', function() {
        $(this).next().toggle();
        this.classList.toggle('open');
    });

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

    container.innerHTML = '<p>' + percentage + '% of ' + data.length + ' apps</p>';

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


