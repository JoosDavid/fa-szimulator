// touring.js

const HUNGARY_BOUNDS = [
    [45.74, 16.11],
    [48.58, 22.90]
];

/* ---------------- TOURING MODE ---------------- */

window.setTouringMap = async function () {

    const s = window.mapState;
    s.mode = "touring";

    clearAllLayers();

    // 1. Create map (OWNED by mapEngine.js)
    window.createMap(
        [47.1625, 19.5033],
        7,
        HUNGARY_BOUNDS
    );

    // 2. Backend init
    await fetch("/touring/start");

    // 3. Render world
    await loadTouringWorld();

    // 4. Sync player
    await syncPlayer();
};

/* ---------------- WORLD LOADING ---------------- */

async function loadTouringWorld() {

    await loadDistricts();
    await loadEdges();
    await loadTrees();
    await loadTouringNodes();
}

/* ---------------- PLAYER SYNC ---------------- */

async function syncPlayer() {

    const player = await fetch("/state").then(r => r.json());

    renderState(player);

    if (player?.player_lat != null) {
        window.initPlayer(player.player_lat, player.player_lon);
    }
}

/* ---------------- TOURING NODES ---------------- */

async function loadTouringNodes() {

    const s = window.mapState;
    if (!s.map || s.mode !== "touring") return;

    // Budapest node
    const bud = await fetch("/touring/budapest").then(r => r.json());

    const budMarker = L.circleMarker([bud.lat, bud.lon], {
        radius: 10,
        color: "#ffcc00",
        fillColor: "#ffcc00",
        fillOpacity: 1
    }).addTo(s.map);

    budMarker.on("click", () => {
        window.requestMove(bud.lat, bud.lon);
    });

    // District nodes
    const points = await fetch("/touring/centroids").then(r => r.json());

    points.forEach((p) => {

        const marker = L.circleMarker([p.lat, p.lon], {
            radius: 6,
            color: "#3c8cff",
            fillColor: "#3c8cff",
            fillOpacity: 0.8
        }).addTo(s.map);

        marker.on("click", () => {
            window.requestMove(p.lat, p.lon);
        });
    });
}

/* ---------------- CLEANUP ---------------- */

function clearAllLayers() {

    const s = window.mapState;
    if (!s.map) return;

    if (s.districtLayer) s.map.removeLayer(s.districtLayer);
    if (s.edgeLayer) s.map.removeLayer(s.edgeLayer);
    if (s.treeLayer) s.map.removeLayer(s.treeLayer);

    if (s.budapestMarker) {
        s.map.removeLayer(s.budapestMarker);
        s.budapestMarker = null;
    }

    s.districtLayer = null;
    s.edgeLayer = null;
    s.treeLayer = null;
}

/* ---------------- EXPORT (optional debug hook) ---------------- */
window.clearTouringLayers = clearAllLayers;