// Store our API endpoint as queryUrl and our fault line json link as faultsLink.
let queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";
let faultsLink = './data/PB2002_boundaries.json';

// Create a function to pick the color based on depth
function depthColor(depth){
  // A color gradient to use
  let palette = ['#ff001d', '#fe591c', '#fa8419', '#efa915', '#dbcc0f', '#00ff00'];
  // Initialize the color
  let color = '#000000';
  // Set color based on depth
  if (depth < 10){
    color = palette[5];
  } else if (depth < 30){
    color = palette[4];
  } else if (depth < 50){
    color = palette[3];
  } else if (depth < 70){
    color = palette[2];
  } else if (depth < 90){
    color = palette[1];
  } else {
    color = palette[0];
  }
  return color;
}


// function for making setting marker options
function markerOptions(magnitude, depth){
  let fadeFraction = Math.abs(depth)/5000;
  let options = {
    radius: 5*magnitude,
    fillcolor: depthColor(depth),
    color: depthColor(depth),
    weight: 1,
    fillOpacity: 0.6
  };
  
  return options;
}


// Perform a GET request to the query URL/
Promise.all([
  d3.json(queryUrl),
  d3.json(faultsLink)]).then(function ([quakes,faults]) {
  // Once we get a response, send the data.features object to the createFeatures function.
  createFeatures(quakes.features, faults.features);
});

// Creates the function to define the features (setting the circles, colors earthquake info popups and fault lines)
function createFeatures(earthquakeData, faultData) {

  // Define a function that we want to run once for each feature in the features array.
  // Give each feature a popup that describes the place and time of the earthquake.
  function onEachFeature(feature, layer) {
    layer.bindPopup(`<h3>${feature.properties.place}</h3><hr><p>${new Date(feature.properties.time)} Depth: ${Math.round(feature.geometry.coordinates[2],1)} meters  Magnitude: ${feature.properties.mag} </p>`);
  }

  // Create a GeoJSON layer that contains the features array on the earthquakeData object.
  // Run the onEachFeature function once for each piece of data in the array.
  let earthquakes = L.geoJSON(earthquakeData, {
    pointToLayer: (feature, latlng) => {
      return new L.circleMarker(latlng, markerOptions(feature.properties.mag, feature.geometry.coordinates[2]));
    },    
    onEachFeature: onEachFeature
  });

  // Create a GeoJSON layer that contains the features array on the faultsData object.
  let faultlines = L.geoJSON(faultData, {
    pointToLayer: (feature, latlng) => {
      return new L.polyline(latlng);
    },    
    style: { color: '#ffb138', weight: 2}
  });
  // Send our earthquakes layer and faults layer to the createMap function/
  createMap(earthquakes, faultlines);
}


// Create the function to display the map
function createMap(earthquakes, faults) {

  // Create the base layers.
  let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  })

  let topo = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  });

  let dark  = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', { maxZoom: 20,
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
  });
  
  
  // Create a baseMaps object.
  let baseMaps = {
    "Street Map": street,
    "Topographic Map": topo,
    "Dark Map": dark
  };

  // Create an overlay object to hold our overlay.
  let overlayMaps = {
    Earthquakes: earthquakes,
    Faults: faults
  };

  // Create our map, giving it the streetmap and earthquakes layers to display on load.
  let myMap = L.map("map", {
    center: [
      37.09, -95.71
    ],
    zoom: 5,
    layers: [street, earthquakes]
  });

  // Create a layer control.
  // Pass it our baseMaps and overlayMaps.
  // Add the layer control to the map.
  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  }).addTo(myMap);
  
  // Initiate the legend.
  let legend = L.control({ position: "bottomright" });

  
  // Set up the legend
  legend.onAdd = function(myMap) {
    let div = L.DomUtil.create("div", "info legend");
    div.innerHTML += "<h4>Earthquake Depth (m)</h4>";
    div.innerHTML += '<i style="background: #00ff00"></i><span>-10 - 10</span><br>';
    div.innerHTML += '<i style="background: #dbcc0f"></i><span>10 -30</span><br>';
    div.innerHTML += '<i style="background: #efa915"></i><span>30 -50</span><br>';
    div.innerHTML += '<i style="background: #fa8419"></i><span>50 -70</span><br>';
    div.innerHTML += '<i style="background: #fe591c"></i><span>70 -90</span><br>';
    div.innerHTML += '<i style="background: #ff001d"></i><span>90+</span><br>';
    
    return div;
  };

  // Adding the legend to the map
  legend.addTo(myMap);
}
