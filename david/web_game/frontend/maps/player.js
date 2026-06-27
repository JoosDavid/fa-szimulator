const playerIcon = L.icon({
    iconUrl: "/static/assets/player.png",
    iconSize: [48, 48],
    iconAnchor: [24, 24]
});

window.initPlayer = function (lat, lon) {

    const s = window.mapState;
    if (!s.map) return;

    if (s.playerMarker) {
        s.map.removeLayer(s.playerMarker);
    }

    s.playerMarker = L.marker([lat, lon], {
        icon: playerIcon,
        pane: "playerPane"
    }).addTo(s.map);
};

window.teleport = async function (lat, lon) {

    if (window.mapState.mode !== "touring") {
        console.log("Teleport disabled in budapest mode");
        return;
    }

    const res = await fetch("/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lon })
    });

    const data = await res.json();

    if (!data.success) {
        alert("Not enough furgon!");
        return;
    }

    window.mapState.playerMarker.setLatLng([
        data.player_lat,
        data.player_lon
    ]);

    window.renderState(data);
};