let map;
let treeMarkers = [];
let mapMode = "budapest";

const treeIcon = L.icon({
    iconUrl: "../assets/tree.png",
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

function setTouringMap() {

    mapMode = "touring";

    if (map) {
        map.remove();
    }

    map = L.map("map").setView(
        [47.1625, 19.5033],
        7
    );

    L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution: "© OpenStreetMap"
        }
    ).addTo(map);

    loadTrees();

    document.getElementById("touringButton").innerText =
        "Budapest";
}

function setBudapestMap() {

    mapMode = "budapest";

    if (map) {
        map.remove();
    }

    map = L.map("map").setView(
        [47.4979, 19.0402],
        12
    );

    L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution: "© OpenStreetMap"
        }
    ).addTo(map);

    document.getElementById("touringButton").innerText =
        "Touring";
}


async function loadTrees() {

    const res = await fetch("http://127.0.0.1:8000/trees");
    const data = await res.json();

    console.log("TREES FROM BACKEND:", data);

    treeMarkers.forEach(m => map.removeLayer(m));
    treeMarkers = [];

    data.forEach(point => {
        console.log("ADDING MARKER:", point);

        const marker = L.marker(
            [point.lat, point.lon],
            { icon: treeIcon }
        ).addTo(map);

        treeMarkers.push(marker);
    });
}


function toggleTouring() {

    if (mapMode === "touring") {
        setBudapestMap();
    } else {
        setTouringMap();
    }
}