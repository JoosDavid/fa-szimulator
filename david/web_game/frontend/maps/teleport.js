window.teleportTargets = [];

/* -------------------------
   SETUP TELEPORT SYSTEM
--------------------------*/
async function setupTeleportSystem() {

    window.teleportTargets = [];

    if (!window.map) {
        console.warn("Teleport: map not ready");
        return;
    }

    // 1. Budapest
    const resB = await fetch("/touring/budapest");
    const budapest = await resB.json();

    registerTeleportTarget(
        "Budapest",
        budapest.lat,
        budapest.lon,
        true
    );

    // 2. District centroids
    const res = await fetch("/touring/centroids");
    const points = await res.json();

    points.forEach((p, i) => {
        registerTeleportTarget(
            `District ${i}`,
            p.lat,
            p.lon,
            false
        );
    });
}

/* -------------------------
   REGISTER TARGET
--------------------------*/
function registerTeleportTarget(name, lat, lon, isMainCity) {

    const marker = L.circleMarker([lat, lon], {
        radius: isMainCity ? 10 : 6,
        color: isMainCity ? "yellow" : "#3c8cff",
        fillColor: isMainCity ? "yellow" : "#3c8cff",
        fillOpacity: 0.9
    }).addTo(window.map);

    marker.on("click", () => {

        console.log("Teleport:", name);

        if (window.setPlayerPosition) {
            window.setPlayerPosition(lat, lon);
        }
    });

    window.teleportTargets.push(marker);

    // spawn player in Budapest initially
    if (isMainCity && window.setPlayerPosition) {
        window.setPlayerPosition(lat, lon);
    }
}