var request = new XMLHttpRequest();

request.open('GET', 'totals.json', true);
request.responseType = 'json';
request.onload = function() {
    try {
        loadData(request.response);
    } catch(e) {
        console.log('booo when loading data', e);
    }
};

request.send();

function loadData(data) {
    
    data.sort(function(a, b) {
        var totalA = a.total * 1.0;
        var totalB = b.total * 1.0;
        return totalA <= totalB;
    });

    var out = document.getElementById('out');

    data.forEach(function(app) {
        
        var tr = out.insertRow(-1);
        tr.className = 'title';

        var tdName = tr.insertCell(-1);
        tdName.innerHTML = app.name;

        var tdTotal = tr.insertCell(-1);
        tdTotal.innerHTML = app.total;

        console.log(app.name, app.total);

        var trDetails = out.insertRow(-1);
        tr.className = 'details';
        var tdDetails = trDetails.insertCell(-1);
        tdDetails.colspan = 2;

        var traitsTable = document.createElement('table');
        tdDetails.appendChild(traitsTable);

        var traits = app.traits;
        traits.sort(function(a, b) {
            return a.amount < b.amount;
        });

        traits.forEach(function(trait) {
            var tr = traitsTable.insertRow(-1);
            var tdAmount = tr.insertCell(-1);
            var tdDesc = tr.insertCell(-1);

            tdAmount.innerHTML = trait.amount.toFixed(2);
            tdDesc.innerHTML = trait.reason;

            var hover = trait.files.join('\n');

            tr.title = hover;

        });

    });

}
