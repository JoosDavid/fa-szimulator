let map = null;
let treeLayer = null;
let districtLayer = null;
let edgeLayer = null;

window.mapMode = "budapest";

/* ---------------- MAP CORE ---------------- */

function createMap(center, zoom) {

    const container = document.getElementById("map");

    if (!container) {
        console.error("Map container missing");
        return;
    }

    if (map) {
        map.remove();
        map = null;
    }

    map = L.map(container, {
        inertia: true,
        zoomAnimation: true,
        fadeAnimation: true,
        maxZoom: 18,
        minZoom: 6
    }).setView(center, zoom);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap"
    }).addTo(map);
}

/* ---------------- LAYERS ---------------- */

async function loadDistricts() {

    const res = await fetch("/touring/districts");
    const geojson = await res.json();

    if (districtLayer) map.removeLayer(districtLayer);

    districtLayer = L.geoJSON(geojson, {
        style: {
            color: "#1d6cff",
            weight: 2,
            fillColor: "#1d6cff",
            fillOpacity: 0.25
        }
    }).addTo(map);
}

async function loadEdges() {

    const res = await fetch("/touring/centroids");
    const points = await res.json();

    if (edgeLayer) map.removeLayer(edgeLayer);

    edgeLayer = L.layerGroup();

    for (let i = 0; i < points.length; i++) {

        const p = points[i];

        L.circleMarker([p.lat, p.lon], {
            radius: 4,
            color: "#003cff",
            fillOpacity: 1
        }).addTo(edgeLayer);

        if (i > 0) {
            const prev = points[i - 1];

            L.polyline(
                [
                    [prev.lat, prev.lon],
                    [p.lat, p.lon]
                ],
                {
                    color: "#3c8cff",
                    weight: 3,
                    opacity: 0.5
                }
            ).addTo(edgeLayer);
        }
    }

    edgeLayer.addTo(map);
}

async function loadTrees() {

    const res = await fetch("/trees");
    const data = await res.json();

    if (treeLayer) map.removeLayer(treeLayer);

    const markers = data.map(p =>
        L.marker([p.lat, p.lon])
    );

    treeLayer = L.layerGroup(markers);
    treeLayer.addTo(map);
}

/* ---------------- MODE SWITCH ---------------- */

window.setBudapestMap = function () {

    window.mapMode = "budapest";

    createMap([47.4979, 19.0402], 12);

    clearLayers();
};

window.setTouringMap = async function () {

    window.mapMode = "touring";

    createMap([47.1625, 19.5033], 7);

    clearLayers();

    try {
        await fetch("/touring/start");
    } catch (e) {
        console.error("touring start failed", e);
        return;
    }

    await loadDistricts();
    await loadEdges();
    await loadTrees();
};

/* ---------------- CLEAR ---------------- */

function clearLayers() {

    if (!map) return;

    if (treeLayer) map.removeLayer(treeLayer);
    if (districtLayer) map.removeLayer(districtLayer);
    if (edgeLayer) map.removeLayer(edgeLayer);

    treeLayer = null;
    districtLayer = null;
    edgeLayer = null;
}

/* ---------------- INIT ---------------- */

window.addEventListener("load", () => {

    setTimeout(() => {
        window.setBudapestMap();
    }, 0);
});