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
        var traits = app.traits;
        traits.sort(makeSorter('amount'));

        // Title
        var trTitle = out.insertRow(-1);
        trTitle.className = 'title';

        // Build up the title:
        var title = app.info.title;

        // If no HTML files are included, there's no way this is an HTML5
        // app.
        var hasHTML = false;
        traits.forEach(function(trait) {
            if (trait.reason === 'HTML files found in code') {
                hasHTML = true;
            }
        });

        // var tdTotal = trTitle.insertCell(-1);
        // tdTotal.innerHTML = app.total;

        var tdName = trTitle.insertCell(-1);
        tdName.innerHTML = '<a href="#show-more" class="reveal-reasons">' + title + '</a>';

        // Details
        var trDetails = out.insertRow(-1);
        trDetails.className = 'details';
        var tdDetails = trDetails.insertCell(-1);
        tdDetails.colSpan = 2;

        if (app.total >= 21 && hasHTML) {
            trTitle.className = trTitle.className + ' yes';
            trDetails.className = trDetails.className + ' yes';
        } else if (app.total >= 15 && hasHTML) {
            trTitle.className = trTitle.className + ' maybe';
            trDetails.className = trDetails.className + ' maybe';
        } else if (!hasHTML) {
            trTitle.className = trTitle.className + ' no';
            trDetails.className = trDetails.className + ' no';
        } else {
            trTitle.className = trTitle.className + ' unlikely';
            trDetails.className = trDetails.className + ' unlikely';
        }

        var traitsTable = document.createElement('table');
        traitsTable.className = 'traits';
        tdDetails.appendChild(traitsTable);

        traits.forEach(function(trait) {
            var traitRow = traitsTable.insertRow(-1);
            var tdAmount = traitRow.insertCell(-1);
            var tdDesc = traitRow.insertCell(-1);

            tdAmount.innerHTML = trait.amount.toFixed(2);
            tdDesc.innerHTML = trait.reason;

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

$(function() {
    $('.reveal-reasons').on('click', function() {
        var $details = $(this).parent().parent().next();
        $details.toggle();
    })
});
