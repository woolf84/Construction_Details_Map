var map = L.map('map',{
    center: [42.350,-71.065],
    zoom: 14,
    minZoom:4,
    maxZoom: 21,
    zoomControl:false,
    loadingControl: true
});

var basemap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    minZoom: 0,
    maxZoom: 21,
    ext: 'png'
}).addTo(map);

var sidebar = L.control.sidebar('sidebar', {
closeButton: false,
position: 'left'
});

map.addControl(sidebar);

setTimeout(function () {
sidebar.show();
}, 500);

var constructionMarkerOptions = {
    radius : 4,
    fillColor : "#4B0082",
    color : "000",
    weight : 1, 
    opacity : 1,
    fillOpacity : .8
};

var constructionPoints = $.ajax({
    url: "data/details_C.geojson",
    dataType: "json",
    success: console.log("construction points successfully loaded."),
    error: function(xhr) {
        alert(xhr.statusText)
    }
});

var constructionTracts = $.ajax({
    url: "data/Details_C_CensusTracts_Sums.geojson",
    dataType: "json",
    success: console.log("details tracts successfully loaded."),
    error: function(xhr) {
        alert(xhr.statusText)
    }
});

$.when(constructionTracts, constructionPoints).done(function() {
function getColor(d) {
    return d > 3475 ? '#800026' :
           d > 1262  ? '#BD0026' :
           d > 789  ? '#E31A1C' :
           d > 466  ? '#FC4E2A' :
           d > 257   ? '#FD8D3C' :
           d > 110   ? '#FEB24C' :
           d > 1   ? '#FED976' :
                      '#FFEDA0';
};

function style(feature) {
    return {
        fillColor: getColor(feature.properties.NUMPOINTS),
        weight: 2,
        opacity: .7,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}; 

function onEachTract(feature, layer) {

    var formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      
        // These options are needed to round to whole numbers if that's what you want.
        //minimumFractionDigits: 0,
        //maximumFractionDigits: 0,
    });
    var pay = formatter.format(feature.properties.PAY_AMOUNT);
    var percent = ((feature.properties.PERCENT)*100).toFixed(2);

    layer.bindPopup("<strong>Details in this census tract</strong>: " + feature.properties.NUMPOINTS + 
    "<br><strong>Percent of details in this tract</strong>: " + percent +
    "<br><strong>Amount paid to cops working details</strong>: " + pay);
};

//function for popup
function buildDetailPopup(datapoints,feature){
	street = feature.feature.properties.address;
	officer = feature.feature.properties.Emp_Name;
	company = feature.feature.properties.Customer_Name;
	start = feature.feature.properties.START_DATETIME;
	end = feature.feature.properties.END_DATETIME;
	paid = feature.feature.properties.Pay_Amount;
	worked = feature.feature.properties.Minutes_Worked;
	content = "<strong>Company: </strong>" + company + "<br>" + "<strong>Start Time and date: </strong>" + start + 
	"<br>" + "<strong>End Time and date: </strong>" + end + 
	"<br>" + "<strong>Location: </strong>" + street + 
	"<br>" + "<strong>Officer: </strong>" + officer +
	"<br>" + "<strong>Amount paid: </strong>" + paid +
	"<br>" + "<strong>Minutes worked: </strong>" + worked;
	feature.bindPopup(content);
};

// Add requested external GeoJSON to map
    var tractsLayer = L.geoJSON(constructionTracts.responseJSON, {
        style: style, 
        onEachFeature: onEachTract
    }).addTo(map);

    var constructionLayer = L.geoJSON(constructionPoints.responseJSON, {
        onEachFeature: buildDetailPopup,
        pointToLayer : function (feature, latlng) {
            return L.circleMarker(latlng, constructionMarkerOptions);
        }
    });

//Create markercluster groups for all the layers. Add a keypress listener for each cluster
	var constructionMarkers = L.markerClusterGroup();
	constructionMarkers.addLayer(constructionLayer);
	constructionMarkers.on('clusterkeypress', function (a) {
		a.layer.zoomToBounds();
	});

    var allLayers = {
        "Details": constructionMarkers,
        "Details, by Tract": tractsLayer
    };

    var legend = L.control({position: 'bottomright'});

    legend.onAdd = function (map) {

        var div = L.DomUtil.create('div', 'info legend'),
            grades = [0, 1, 110, 257, 465, 789, 1262, 3475],
            labels = [];

        // loop through our density intervals and generate a label with a colored square for each interval
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
                grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + 'construction details <br>' : '+');
        }

        return div;
        };

    legend.addTo(map);
    L.control.layers(null, allLayers, { collapsed: false }).addTo(map);
});