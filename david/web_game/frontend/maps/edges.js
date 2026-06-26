async function loadEdges() {

    if (!window.map) {
        console.warn("Edges: map not ready");
        return;
    }

    try {
        const res = await fetch("/touring/centroids");
        const points = await res.json();

        window.touringCentroids = points;

        // remove old layer safely
        if (edgeLayer) {
            window.map.removeLayer(edgeLayer);
            edgeLayer = null;
        }

        edgeLayer = L.layerGroup();

        // draw centroid nodes + connections
        for (let i = 0; i < points.length; i++) {

            const p = points[i];

            // optional centroid marker
            const node = L.circleMarker([p.lat, p.lon], {
                radius: 4,
                color: "#003cff",
                fillColor: "#003cff",
                fillOpacity: 1,
                weight: 1
            });

            node.on("click", () => {
                console.log("Centroid clicked:", i, p);
            });

            edgeLayer.addLayer(node);

            // connect to previous centroid
            if (i > 0) {

                const prev = points[i - 1];

                const line = L.polyline(
                    [
                        [prev.lat, prev.lon],
                        [p.lat, p.lon]
                    ],
                    {
                        color: "#3c8cff",
                        weight: 3,
                        opacity: 0.5
                    }
                );

                // hover interaction (visual polish layer)
                line.on("mouseover", () => {
                    line.setStyle({
                        opacity: 0.9,
                        weight: 5
                    });
                });

                line.on("mouseout", () => {
                    line.setStyle({
                        opacity: 0.5,
                        weight: 3
                    });
                });

                line.on("click", () => {
                    console.log("Edge clicked:", i - 1, "->", i);
                });

                edgeLayer.addLayer(line);
            }
        }

        edgeLayer.addTo(window.map);

    } catch (err) {
        console.error("Failed to load edges:", err);
    }
}