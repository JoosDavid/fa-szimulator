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

    if (!window.window.mapState.mode) window.window.mapState.mode = "budapest";

    if (window.window.mapState.mode === "touring") {
        window.setBudapestMap();
        btn.innerText = "Touring";
    } else {
        window.setTouringMap();
        btn.innerText = "Budapest";
    }
}
/* ---------------- INIT ---------------- */
window.addEventListener("load", async () => {
    await loadState();

    // Start the game in Budapest mode
    if (typeof window.setBudapestMap === "function") {
        await window.setBudapestMap();

        const btn = document.getElementById("touringButton");
        if (btn) {
            btn.innerText = "Touring";
        }
    } else {
        console.error("setBudapestMap is not defined. Check script order in index.html.");
    }
});