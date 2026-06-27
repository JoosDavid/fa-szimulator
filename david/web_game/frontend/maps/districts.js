async function loadDistricts() {

    const s = window.mapState;
    if (!s.map) return;

    const res = await fetch("/touring/districts");
    const geojson = await res.json();

    if (s.districtLayer) {
        s.map.removeLayer(s.districtLayer);
    }

    s.districtLayer = L.geoJSON(geojson, {

        style: {
            color: "#1d6cff",
            weight: 2,
            fillColor: "#1d6cff",
            fillOpacity: 0.25
        },

        onEachFeature: (feature, layer) => {

            layer.on("mouseover", () => {
                layer.setStyle({
                    fillOpacity: 0.45,
                    weight: 3
                });
            });

            layer.on("mouseout", () => {
                s.districtLayer.resetStyle(layer);
            });

            layer.on("click", async () => {

                const center = layer.getBounds().getCenter();

                await window.requestMove(center.lat, center.lng);

                if (s.selectedDistrict) {
                    s.districtLayer.resetStyle(s.selectedDistrict);
                }

                s.selectedDistrict = layer;

                layer.setStyle({
                    fillOpacity: 0.6,
                    color: "#00ffcc",
                    weight: 4
                });
            });
        }

    }).addTo(s.map);
}