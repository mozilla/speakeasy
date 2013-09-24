var request = new XMLHttpRequest();

request.open('GET', 'totals.json', true);
request.responseType = 'text';
request.onload = function() {
    try {
        var data = request.response;
        var json = JSON.parse(data);
        loadData(json);
    } catch(e) {
        console.log('booo when loading data', e);
    }
};

request.send();

function loadData(data) {

    data.sort(makeSorter('total'));

    var out = document.getElementById('out');

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

        tdDetails.innerHTML = '<p>Play Store: <a href="https://play.google.com/store/apps/details?id=' + app.name + '" target="_blank" rel="noreferrer">' + app.name + '</a></p>';

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

    $('#out tr.title').on('click', function() {
        $(this).next().toggle();
        this.classList.toggle('open');
    });
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


