async function loadDistricts() {

    const res = await fetch("/touring/districts");
    const geojson = await res.json();

    window.touringDistricts = geojson;

    if (districtLayer) {
        window.map.removeLayer(districtLayer);
    }

    districtLayer = L.geoJSON(geojson, {
        style: {
            color: "#1d6cff",
            weight: 2,
            fillColor: "#1d6cff",
            fillOpacity: 0.25
        },
        onEachFeature: function (feature, layer) {

            layer.on("mouseover", () => {
                layer.setStyle({
                    fillOpacity: 0.4,
                    weight: 3
                });
            });

            layer.on("mouseout", () => {
                layer.setStyle({
                    fillOpacity: 0.25,
                    weight: 2
                });
            });

            layer.on("click", () => {
                console.log("District clicked:", feature);
            });
        }
    }).addTo(window.map);
}