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

    data.forEach(function(app) {

        // Title
        var trTitle = out.insertRow(-1);
        trTitle.className = 'title';

        var tdTotal = trTitle.insertCell(-1);
        tdTotal.innerHTML = app.total;
        
        var tdName = trTitle.insertCell(-1);
        tdName.innerHTML = app.info.title;


        // Details

        var trDetails = out.insertRow(-1);
        trDetails.className = 'details';
        var tdDetails = trDetails.insertCell(-1);
        tdDetails.colSpan = 2;

        var traitsTable = document.createElement('table');
        traitsTable.className = 'traits';
        tdDetails.appendChild(traitsTable);

        var traits = app.traits;
        traits.sort(makeSorter('amount'));

        traits.forEach(function(trait) {
            var traitRow = traitsTable.insertRow(-1);
            var tdAmount = traitRow.insertCell(-1);
            var tdDesc = traitRow.insertCell(-1);

            tdAmount.innerHTML = trait.amount.toFixed(2);
            tdDesc.innerHTML = trait.reason;

            console.log(trait.amount.toFixed(2));
            if (trait.amount.toFixed(2) >= 15) {
                alert('OMG!')
            }

            var hover = trait.files.join('\n');

            traitRow.title = hover;

        });

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
