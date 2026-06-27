/* ---------------- MISSIONS ---------------- */

async function openMissions() {
    const panel = document.getElementById("missionsPanel");

    if (!panel) {
        console.error("missionsPanel element not found in index.html");
        return;
    }

    panel.classList.toggle("hidden");

    if (!panel.classList.contains("hidden")) {
        await loadMissions();
    }
}

function closeMissions() {
    const panel = document.getElementById("missionsPanel");

    if (!panel) {
        return;
    }

    panel.classList.add("hidden");
}

async function loadMissions() {
    const missionsList = document.getElementById("missionsList");
    const missionFeedback = document.getElementById("missionFeedback");

    missionsList.innerHTML = "A küldetések nőnek...";
    missionFeedback.innerHTML = "";

    const response = await fetch("/missions");
    const data = await response.json();

    renderMissions(data.missions, data.szakertelem);
}

function renderMissions(missions, szakertelem) {
    const missionsList = document.getElementById("missionsList");

    missionsList.innerHTML = "";

    const info = document.createElement("p");
    info.innerHTML = `
        Ebben a körben 12 küldetésed van.
        Új küldetések csak az <strong>End Turn</strong> gomb után érkeznek.
    `;
    missionsList.appendChild(info);

    missions.forEach((mission) => {
        const card = document.createElement("div");
        card.className = mission.completed ? "mission-card completed" : "mission-card";

        card.innerHTML = `
            <h3>${mission.completed ? "✅ " : ""}${mission.problem}</h3>

            <p>${mission.description}</p>

            <p>
                <strong>Fa:</strong>
                ${mission.hungarian_name}
                ${mission.latin_name ? `<em>(${mission.latin_name})</em>` : ""}
            </p>

            <p>
                <strong>Hely információ:</strong>
                ${mission.location_hint}
            </p>

            <p>
                <strong>Szükséges szakértelem:</strong>
                ${mission.required_szakertelem}
            </p>

            <p>
                <strong>Jutalom:</strong>
                +${mission.reward_elegedettseg} elégedettség
            </p>

            <p>
                <strong>Jelenlegi szakértelmed:</strong>
                ${szakertelem}
            </p>
        `;

        missionsList.appendChild(card);
    });
}

window.checkMissionTree = async function (treeId) {
    const response = await fetch("/missions/check_tree", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            tree_id: treeId,
        }),
    });

    const data = await response.json();

    const missionFeedback = document.getElementById("missionFeedback");

    if (data.success) {
        missionFeedback.innerHTML = `
            <div class="mission-success">
                ✅ ${data.message}<br>
                Megoldott probléma: <strong>${data.mission.problem}</strong><br>
                Fa: <strong>${data.mission.hungarian_name}</strong><br>
                Jutalom: <strong>+${data.reward_elegedettseg} elégedettség</strong>
            </div>
        `;

        if (data.state) {
            window.renderState(data.state);
        }

        await loadMissions();
        return;
    }

    if (data.reason === "Ez nem egy aktív küldetés fája.") {
        missionFeedback.innerHTML = `
            <div class="mission-fail">
                Ez nem a keresett fa.
            </div>
        `;
        return;
    }

    missionFeedback.innerHTML = `
        <div class="mission-fail">
            ❌ ${data.reason}<br>
            Szükséges szakértelem: ${data.required_szakertelem}<br>
            Jelenlegi szakértelem: ${data.current_szakertelem}
        </div>
    `;
};