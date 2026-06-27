window.renderState = function (data) {

    console.log("renderState:", data);

    document.getElementById("time").innerText =
        data.time ?? "NO TIME";

    document.getElementById("resources").innerText =
        `Elégedettség: ${data.elegedettseg} | ` +
        `Szakértelem: ${data.szakertelem} | ` +
        `Furgon: ${data.furgon}`;
};

async function loadState() {
    try {
        const res = await fetch("/state");
        const data = await res.json();

        window.renderState(data);

    } catch (err) {
        console.error("Failed to load state:", err);
    }
}

async function endTurn() {
    try {
        const res = await fetch("/end_turn");
        const data = await res.json();

        window.renderState(data);

    } catch (err) {
        console.error("End turn failed:", err);
    }
}

/* ---------------- UI ---------------- */

function openProfile() {
    console.log("Profile clicked");
}

function openMissions() {
    console.log("Mission clicked");
}

/* ---------------- TOURING BUTTON ---------------- */

function toggleTouring() {

    const btn = document.getElementById("touringButton");

    if (!window.mapMode) window.mapMode = "budapest";

    if (window.mapMode === "touring") {

        window.mapMode = "budapest";
        window.setBudapestMap();

        btn.innerText = "Enter Touring";

    } else {

        window.mapMode = "touring";
        window.setTouringMap();

        btn.innerText = "Exit Touring";
    }
}

/* ---------------- INIT ---------------- */

window.addEventListener("load", async () => {
    await loadState();
    window.mapMode = "budapest";
});