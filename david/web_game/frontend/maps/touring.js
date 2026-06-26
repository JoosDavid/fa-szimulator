let map;
let treeMarkers = [];

const HUNGARY_BOUNDS = [
    [45.74, 16.11],
    [48.58, 22.90]
];

const BUDAPEST_BOUNDS = [
    [47.35, 18.85],
    [47.62, 19.40]
];

const treeIcon = L.icon({
    iconUrl: "/static/assets/tree.png",
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

/* -----------------------------
   MAP CORE
------------------------------*/
function createMap(bounds, center, zoom) {

    if (map) {
        map.remove();
        map = null;
    }

    map = L.map("map", {
        inertia: true,
        zoomAnimation: true,
        fadeAnimation: true,
        markerZoomAnimation: true,

        maxBounds: bounds,
        maxBoundsViscosity: 1.0,

        minZoom: zoom,
        maxZoom: 18,

        bounceAtZoomLimits: false,
        worldCopyJump: false
    }).setView(center, zoom);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19
    }).addTo(map);

    map.scrollWheelZoom.enable();

    // smoother, safer boundary enforcement
    map.on("drag", () => {
        map.panInsideBounds(bounds, { animate: false });
    });

    map.doubleClickZoom.disable();
}

/* -----------------------------
   TOURING MODE
------------------------------*/
async function setTouringMap() {

    console.log("TOURING MODE");

    try {
        await fetch("/touring/start");
    } catch (e) {
        console.error("Touring start failed:", e);
        return;
    }

    createMap(HUNGARY_BOUNDS, [47.1625, 19.5033], 7);

    await loadTrees();
}

/* -----------------------------
   BUDAPEST MODE
------------------------------*/
function setBudapestMap() {

    console.log("BUDAPEST MODE");

    createMap(BUDAPEST_BOUNDS, [47.4979, 19.0402], 12);
}

/* -----------------------------
   TREES
------------------------------*/
async function loadTrees() {

    if (!map) return;

    const res = await fetch("/trees");
    const data = await res.json();

    // clear old markers safely
    treeMarkers.forEach(m => map.removeLayer(m));
    treeMarkers = [];

    // add all markers immediately (NO setTimeout)
    for (const point of data) {

        const marker = L.marker(
            [point.lat, point.lon],
            { icon: treeIcon }
        ).addTo(map);

        treeMarkers.push(marker);
    }
}

/* -----------------------------
   INIT
------------------------------*/
window.addEventListener("load", () => {
    setBudapestMap();
});