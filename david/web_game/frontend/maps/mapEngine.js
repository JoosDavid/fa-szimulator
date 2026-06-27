window.mapState = window.mapState || {};

window.createMap = function(center, zoom, bounds) {

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
};