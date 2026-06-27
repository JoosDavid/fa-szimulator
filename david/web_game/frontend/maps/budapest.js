console.log("budapest.js loaded");

window.budapestTreeLayer = null;

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[char];
    });
}

async function loadBudapestTrees() {
    if (!window.mapState.map) {
        console.warn("Budapest trees: map not ready");
        return;
    }

    try {
        const res = await fetch("/trees/budapest");

        if (!res.ok) {
            console.error("Could not load Budapest trees:", await res.text());
            return;
        }

        const trees = await res.json();

        if (window.budapestTreeLayer) {
            window.mapState.map.removeLayer(window.budapestTreeLayer);
            window.budapestTreeLayer = null;
        }

        const canvasRenderer = L.canvas({ padding: 0.5 });
        const markers = [];

        for (const tree of trees) {
            const marker = L.circleMarker([tree.lat, tree.lon], {
                renderer: canvasRenderer,
                radius: 3,
                stroke: false,
                fillColor: "green",
                fillOpacity: 0.75
            });

            marker.bindTooltip(
                `<b>${escapeHtml(tree.hungarian_name)}</b><br><i>${escapeHtml(tree.latin_name)}</i>`,
                {
                    direction: "top",
                    sticky: true,
                    opacity: 0.95
                }
            );
            
            marker.on("click", () => {
                if (typeof window.checkMissionTree === "function") {
                    window.checkMissionTree(tree.id);
                }
            });

            markers.push(marker);
        }

        window.budapestTreeLayer = L.layerGroup(markers);
        window.budapestTreeLayer.addTo(window.mapState.map);

        console.log(`Loaded ${trees.length} Budapest trees`);

    } catch (err) {
        console.error("Failed to load Budapest trees:", err);
    }
}

/*
    This overrides only the Budapest-mode function.
    touring.js stays unchanged.
*/
window.setBudapestMap = async function () {
    window.mapState.mode = "budapest";

    createMap([47.4979, 19.0402], 12);

    if (typeof clearAllLayers === "function") {
        clearAllLayers();
    }

    await loadBudapestTrees();
};