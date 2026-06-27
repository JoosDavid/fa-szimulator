const treeIcon = L.icon({
    iconUrl: "/static/assets/tree.png",
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

async function loadTrees() {

    const s = window.mapState;
    if (!s.map) return;

    const res = await fetch("/trees");
    const data = await res.json();

    if (s.treeLayer) {
        s.map.removeLayer(s.treeLayer);
    }

    const markers = data.map(p =>
        L.marker([p.lat, p.lon], {
            icon: treeIcon,
            pane: "treesPane"
        })
    );

    s.treeLayer = L.layerGroup(markers).addTo(s.map);
}