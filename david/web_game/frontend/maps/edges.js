function haversine(lat1, lon1, lat2, lon2) {

    const R = 6371;
    const toRad = d => d * Math.PI / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function loadEdges() {

    const s = window.mapState;
    if (!s.map) return;

    const res = await fetch("/touring/centroids");
    const points = await res.json();

    // CLEAN OLD LAYER
    if (s.edgeLayer) {
        s.map.removeLayer(s.edgeLayer);
        s.edgeLayer = null;
    }

    s.edgeLayer = L.layerGroup();

    // NODES
    for (const p of points) {
        L.circleMarker([p.lat, p.lon], {
            radius: 4,
            color: "#003cff",
            fillOpacity: 1
        }).addTo(s.edgeLayer);
    }

    // FULL GRAPH
    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {

            const a = points[i];
            const b = points[j];

            const dist = haversine(a.lat, a.lon, b.lat, b.lon);

            const line = L.polyline(
                [[a.lat, a.lon], [b.lat, b.lon]],
                {
                    color: "#3c8cff",
                    weight: 2,
                    opacity: 0.35
                }
            );

            line.bindTooltip(`${dist.toFixed(1)} km`, {
                sticky: true,
                direction: "center"
            });

            s.edgeLayer.addLayer(line);
        }
    }

    s.edgeLayer.addTo(s.map);
}