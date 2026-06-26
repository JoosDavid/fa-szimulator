async function loadState() {

    try {
        const res = await fetch("/state");
        const data = await res.json();

        document.getElementById("time").innerText = data.time;

        document.getElementById("resources").innerText =
            `Elégedettség: ${data.elegedettseg} | ` +
            `Szakértelem: ${data.szakertelem} | ` +
            `Furgon: ${data.furgon}`;

    } catch (err) {
        console.error("Failed to load state:", err);
    }
}

async function endTurn() {

    try {
        const res = await fetch("/end_turn", {
            method: "POST"
        });

        const data = await res.json();

        document.getElementById("time").innerText = data.time;

        document.getElementById("resources").innerText =
            `Elégedettség: ${data.elegedettseg} | ` +
            `Szakértelem: ${data.szakertelem} | ` +
            `Furgon: ${data.furgon}`;

    } catch (err) {
        console.error("End turn failed:", err);
    }
}

function openProfile() {
    console.log("Profile clicked");
}

function openMissions() {
    console.log("Mission clicked");
}

/* -----------------------------
   TOURING TOGGLE (IMPORTANT)
------------------------------*/
function toggleTouring() {

    console.log("TOURING BUTTON CLICKED");

    const btn = document.getElementById("touringButton");

    if (!window.mapMode) {
        window.mapMode = "budapest";
    }

    if (window.mapMode === "touring") {

        window.mapMode = "budapest";
        window.setBudapestMap();

        btn.innerText = "Touring";

    } else {

        window.mapMode = "touring";
        window.setTouringMap();

        btn.innerText = "Budapest";
    }
}

loadState();