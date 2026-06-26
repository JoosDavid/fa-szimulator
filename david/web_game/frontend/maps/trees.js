const treeIcon = L.icon({
    iconUrl: "/static/assets/tree.png",
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

/* ---------------- TREES ---------------- */

async function loadTrees() {

    if (!window.map) {
        console.warn("Trees: map not ready");
        return;
    }

    try {
        const res = await fetch("/trees");
        const data = await res.json();

        // remove old layer safely
        if (treeLayer) {
            window.map.removeLayer(treeLayer);
            treeLayer = null;
        }

        const markers = [];

        for (const p of data) {

            const marker = L.marker([p.lat, p.lon], {
                icon: treeIcon
            });

            markers.push(marker);
        }

        treeLayer = L.layerGroup(markers);
        treeLayer.addTo(window.map);

    } catch (err) {
        console.error("Failed to load trees:", err);
    }
}