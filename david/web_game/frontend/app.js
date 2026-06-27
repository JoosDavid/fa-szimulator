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

    // safety fallback
    if (!window.mapMode) window.mapMode = "budapest";

    if (window.mapMode === "touring") {
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