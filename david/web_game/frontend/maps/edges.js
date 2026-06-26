let edgeLayer = null;

function haversine(lat1, lon1, lat2, lon2) {

    const R = 6371; // km

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

    if (!window.map) return;

    const res1 = await fetch("/touring/centroids");
    const districts = await res1.json();

    const res2 = await fetch("/touring/budapest");
    const budapest = await res2.json();

    if (edgeLayer) {
        window.map.removeLayer(edgeLayer);
    }

    edgeLayer = L.layerGroup();

    /* -----------------------------
       BUDAPEST NODE (HUB)
    ------------------------------*/
    const centerNode = L.circleMarker(
        [budapest.lat, budapest.lon],
        {
            radius: 10,
            color: "#ffcc00",
            fillColor: "#ffcc00",
            fillOpacity: 1,
            weight: 2
        }
    ).bindPopup("Budapest (Hub)");

    edgeLayer.addLayer(centerNode);

    /* -----------------------------
       DISTRICT NODES + CONNECTIONS
    ------------------------------*/
    for (let i = 0; i < districts.length; i++) {

        const d = districts[i];

        // district node
        const node = L.circleMarker([d.lat, d.lon], {
            radius: 5,
            color: "#003cff",
            fillColor: "#003cff",
            fillOpacity: 1
        });

        node.on("click", () => {
            console.log("District clicked:", i);
        });

        edgeLayer.addLayer(node);

        // connection: Budapest → District
        const distance = haversine(
            budapest.lat,
            budapest.lon,
            d.lat,
            d.lon
        );
        
        const line = L.polyline(
            [
                [budapest.lat, budapest.lon],
                [d.lat, d.lon]
            ],
            {
                color: "#3c8cff",
                weight: 3,
                opacity: 0.5
            }
        );
        
        line.bindTooltip(
            `${distance.toFixed(1)} km`,
            {
                sticky: true,
                className: "edge-distance-tooltip"
            }
        );
        
        line.on("mouseover", () => {
            line.setStyle({
                opacity: 0.9,
                weight: 5
            });
            line.openTooltip();
        });
        
        line.on("mouseout", () => {
            line.setStyle({
                opacity: 0.5,
                weight: 3
            });
            line.closeTooltip();
        });
        
        line.on("click", () => {
            console.log(`Budapest → District ${i}`);
        });
        
        edgeLayer.addLayer(line);
    }
    edgeLayer.addTo(window.map);
}