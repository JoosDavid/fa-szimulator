# Fa-szimulátor (Tree Simulator)

An educational, map-based game about caring for Budapest's notable trees. The
player manages **elégedettség** (satisfaction), **szakértelem** (expertise) and
**furgon** (van fuel/range), completes tree-care missions, answers a quiz to
grow expertise, and once satisfaction is high enough unlocks a "touring" mode
that explores random Hungarian districts on a map.

The text is in Hungarian; this document is in English to describe the code.

## Repository layout

```
fa-szimulator/
├── david/
│   ├── web_game/            ← the actual game (FastAPI backend + Leaflet frontend)
│   │   ├── backend/         ← Python API + game logic + data
│   │   └── frontend/        ← static HTML/CSS/JS served by the backend
│   └── prototype/          ← archived pygame desktop prototype (not wired in)
├── lili/                   ← quiz + story source data exports
└── data_prep/             ← data-preparation scratch (mostly gitignored)
```

> **The maintained project is `david/web_game/`.** `david/prototype/` is an early
> pygame prototype that is no longer wired into anything (see its own README),
> and `lili/` plus `data_prep/` hold data-preparation source/leftovers.

## Architecture (`david/web_game`)

The game is a single-player, single-process web app. **All game state lives in
one in-memory `GameState` instance on the server** — there is no database and no
per-user session, so the server holds exactly one game at a time. The browser is
a thin rendering layer that calls the API and redraws.

```
Browser (Leaflet map + panels)
   │   fetch() JSON over HTTP
   ▼
FastAPI app (backend/main.py)
   ├── GameState        – resources, time, player position, touring state
   ├── MissionManager   – generates/checks per-turn tree missions
   ├── quiz router      – serves stories & quiz questions from JSONL
   └── geo (DISTRICTS)  – GeoPandas shapefile of Hungarian districts
```

### Backend (`backend/`)

| File | Responsibility |
|------|----------------|
| `main.py` | FastAPI app: wires routers, serves the frontend, and defines the state / time / touring / trees / move endpoints. |
| `game_state.py` | `GameState` class — the single source of truth for resources, clock, player position, quiz/turn flags, and touring unlock. Pure logic, no web framework. |
| `missions.py` | `MissionManager` — builds 12 missions per turn (2 per difficulty level) from the Budapest tree sample and exposes `/missions` + `/missions/check_tree`. |
| `quiz.py` | Router that reads notable-tree stories and quiz questions from JSONL and serves `/quiz/stories` + `/quiz/questions`. |
| `geo.py` | Loads `hungary_level7.shp` with GeoPandas, reprojects to WGS84 (EPSG:4326), assigns `district_id`. |
| `data/` | `budapest_trees_sample_10000.json`, quiz/story JSONL files. |
| `dendro_final.csv` | Tree coordinates used by `/trees`. |
| `hungary_level7.*` | Shapefile (shp/shx/dbf/prj/cpg) of Hungarian districts. |

**Key endpoints**

- `GET  /` – serves `frontend/index.html`; `/static/*` serves the frontend folder.
- `GET  /state` – the full game state snapshot the UI renders from.
- `POST /end_turn` – advances the clock, applies penalties for incomplete missions, rolls new missions.
- `POST /move` – moves the player, charging `furgon` by haversine distance.
- `GET  /touring/start | /districts | /centroids | /budapest` – touring-mode world data.
- `GET  /trees` (touring) and `GET /trees/budapest` (city) – tree markers.
- `POST /quiz/start | /quiz/correct` and `GET /quiz/questions | /quiz/stories`.
- `GET  /missions`, `POST /missions/check_tree`.

### Frontend (`frontend/`)

Plain ES (no build step, no framework). Scripts are loaded in order from
`index.html` and communicate through globals on `window`. State flows one way:
an endpoint returns the new `state`, and `renderState(data)` (in `app.js`)
updates the DOM.

| File | Responsibility |
|------|----------------|
| `index.html` | Layout, sidebar buttons (wired via inline `onclick`), panels, and the `<script>` load order. |
| `mapState.js` | The shared `window.mapState` object (current map, layers, mode, player marker). |
| `maps/mapEngine.js` | `createMap()` — builds the Leaflet map and panes; single source of truth for map creation. |
| `maps/budapest.js` | City mode: loads/renders the 10k Budapest tree sample, sets `setBudapestMap()`. |
| `maps/touring.js` | Touring mode: creates the Hungary map, loads districts/edges/trees/nodes, syncs player. |
| `maps/districts.js` | Renders district polygons; click = move there. |
| `maps/edges.js` | Draws the full graph between district centroids with km distances. |
| `maps/trees.js` | Renders touring-mode tree markers. |
| `maps/player.js` | Player marker + `requestMove()` (calls `/move`). |
| `app.js` | Boot, `renderState()`, `endTurn()`, touring toggle. |
| `quiz.js` | Quiz panel: stories, questions, scoring, calls `/quiz/*`. |
| `missions.js` | Missions panel: list, `checkMissionTree()` → `/missions/check_tree`. |

### Game loop

1. A **turn** is 30 in-game minutes. `End Turn` advances the clock, subtracts
   10 satisfaction per incomplete mission, resets expertise/quiz flags, and
   generates 12 new missions.
2. **Missions**: click the matching tree on the map; if you have enough
   expertise the mission completes and grants satisfaction.
3. **Quiz** ("Móka"): once per turn, each correct answer grants +1 expertise
   (capped at 5/turn).
4. When satisfaction ≥ `touring_goal` (1200), **touring** unlocks: explore
   random districts, moving the van between centroids costs fuel.

## Running it

```bash
cd david/web_game
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

Then open http://127.0.0.1:8000/. Data and frontend paths are resolved relative
to the source files, so the server also runs from any working directory.

> Requires `backend/data/budapest_trees_sample_10000.json` to exist (the mission
> & Budapest-tree features need it).
