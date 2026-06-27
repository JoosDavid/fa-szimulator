// touring.js

const BUDAPEST_BOUNDS = [
    [47.35, 18.85],
    [47.62, 19.40]
];

const HUNGARY_BOUNDS = [
    [45.74, 16.11],
    [48.58, 22.90]
];

/* ---------------- MAP CORE ---------------- */

function createMap(center, zoom, bounds) {

    const s = window.mapState;

    if (s.map) {
        s.map.remove();
    }

    const container = document.getElementById("map");
    if (!container) return;

    s.map = L.map(container, {
        inertia: true,
        zoomAnimation: true,
        fadeAnimation: true,
        maxBounds: bounds,
        maxBoundsViscosity: 1.0,
        minZoom: zoom,
        maxZoom: 18
    }).setView(center, zoom);

    s.map.createPane("treesPane");
    s.map.getPane("treesPane").style.zIndex = 400;

    s.map.createPane("playerPane");
    s.map.getPane("playerPane").style.zIndex = 650;

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap"
    }).addTo(s.map);
}

/* ---------------- BUDAPEST MODE ---------------- */

window.setBudapestMap = async function () {

    const s = window.mapState;
    s.mode = "budapest";

    clearAllLayers();
    createMap([47.4979, 19.0402], 12, BUDAPEST_BOUNDS);

    await fetch("/reset");

    // REMOVE PLAYER explicitly
    if (s.playerMarker) {
        s.map.removeLayer(s.playerMarker);
        s.playerMarker = null;
    }
};

/* ---------------- TOURING MODE (MISSING PIECE FIXED) ---------------- */

async function loadTouringNodes() {

    const s = window.mapState;
    if (!s.map || s.mode !== "touring") return;

    const bud = await fetch("/touring/budapest").then(r => r.json());

    // Budapest node (yellow)
    const budMarker = L.circleMarker([bud.lat, bud.lon], {
        radius: 10,
        color: "#ffcc00",
        fillColor: "#ffcc00",
        fillOpacity: 1
    }).addTo(s.map);

    budMarker.on("click", () => {
        window.teleport(bud.lat, bud.lon);
    });

    // district centroids
    const points = await fetch("/touring/centroids").then(r => r.json());

    points.forEach((p, i) => {

        const marker = L.circleMarker([p.lat, p.lon], {
            radius: 6,
            color: "#3c8cff",
            fillColor: "#3c8cff",
            fillOpacity: 0.8
        }).addTo(s.map);

        marker.on("click", () => {
            window.teleport(p.lat, p.lon);
        });
    });
}

window.setTouringMap = async function () {

    const s = window.mapState;
    s.mode = "touring";

    clearAllLayers();

    createMap([47.1625, 19.5033], 7, HUNGARY_BOUNDS);

    await fetch("/touring/start");

    await loadDistricts();
    await loadEdges();
    await loadTrees();
    await loadTouringNodes();

    const player = await fetch("/state").then(r => r.json());

    renderState(player);
    if (player?.player_lat != null) {
        window.initPlayer(player.player_lat, player.player_lon);
    }
};

/* ---------------- CLEAR ---------------- */

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

/* ---------------- EXPORT ---------------- */
window.createMap = createMap;