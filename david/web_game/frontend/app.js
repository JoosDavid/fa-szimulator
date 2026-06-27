window.currentGameState = null;

window.renderState = function (data) {
    console.log("renderState:", data);

    window.currentGameState = data;

    document.getElementById("time").innerText = data.time ?? "NO TIME";

    document.getElementById("resources").innerText =
        `Elégedettség: ${data.elegedettseg} / ${data.touring_goal} | ` +
        `Szakértelem: ${data.szakertelem} | ` +
        `Furgon: ${Math.round(data.furgon)} | ` +
        `Móka ebben a körben: ${data.quiz_used_this_turn ? "igen" : "nem"}`;

    const touringButton = document.getElementById("touringButton");

    if (touringButton) {
        if (data.touring_unlocked) {
            touringButton.disabled = false;
            touringButton.title = "";
        } else {
            touringButton.disabled = true;
            touringButton.title = `Túrázáshoz legalább ${data.touring_goal} elégedettség kell.`;
        }
    }
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
        const res = await fetch("/end_turn", {
            method: "POST"
        });

        const data = await res.json();

        window.renderState(data);

        let message =
            `Kör vége. Befejezetlen küldetések: ${data.turn_summary.incomplete_missions}. ` +
            `Elégedettség levonás: -${data.turn_summary.penalty}. ` +
            `Új küldetések érkeztek.`;

        if (data.touring_unlocked) {
            message += " A túrázás feloldva!";
        }

        alert(message);

        const missionsPanel = document.getElementById("missionsPanel");

        if (missionsPanel && !missionsPanel.classList.contains("hidden")) {
            await loadMissions();
        }

    } catch (err) {
        console.error("End turn failed:", err);
    }
}

/* ---------------- UI ---------------- */

function openProfile() {
    console.log("Profile clicked");
}

/* ---------------- TOURING BUTTON ---------------- */

function toggleTouring() {
    const btn = document.getElementById("touringButton");

    if (!window.currentGameState?.touring_unlocked) {
        alert(
            `A túrázáshoz legalább ${window.currentGameState?.touring_goal ?? 1200} elégedettség kell.`
        );
        return;
    }

    if (!window.mapState.mode) {
        window.mapState.mode = "budapest";
    }

    if (window.mapState.mode === "touring") {
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