from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from shapely.geometry import Point
from pydantic import BaseModel
import csv
import math

from backend.quiz import router as quiz_router
from backend.game_state import GameState
from backend.geo import DISTRICTS

app = FastAPI()

# -----------------------------
# STATIC
# -----------------------------
app.mount("/static", StaticFiles(directory="frontend"), name="static")

@app.get("/")
def home():
    return FileResponse("frontend/index.html")

# -----------------------------
# CORS
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(quiz_router)

game = GameState()

# -----------------------------
# STATE
# -----------------------------
@app.get("/state")
def get_state():
    return {
        "time": game.get_time(),
        "elegedettseg": game.elegedettseg,
        "szakertelem": game.szakertelem,
        "furgon": game.furgon,
        "player_lat": game.player_lat,
        "player_lon": game.player_lon
    }

# -----------------------------
# TIME
# -----------------------------
@app.post("/end_turn")
def end_turn():
    game.next_turn()
    return get_state()

@app.post("/reset")
def reset():
    game.reset_touring()
    return get_state()

# -----------------------------
# TOURING
# -----------------------------
CURRENT_DISTRICTS = None

@app.get("/touring/start")
def start_touring():
    global CURRENT_DISTRICTS

    CURRENT_DISTRICTS = DISTRICTS.sample(6).copy()
    CURRENT_DISTRICTS = CURRENT_DISTRICTS.to_crs(epsg=4326)

    game.reset_touring()

    return {"count": len(CURRENT_DISTRICTS)}

@app.get("/touring/districts")
def get_districts():
    if CURRENT_DISTRICTS is None:
        return {"type": "FeatureCollection", "features": []}

    return {
        "type": "FeatureCollection",
        "features": CURRENT_DISTRICTS.__geo_interface__["features"]
    }

@app.get("/touring/budapest")
def get_budapest():
    return {"lat": 47.4979, "lon": 19.0402}

@app.get("/touring/centroids")
def get_centroids():
    if CURRENT_DISTRICTS is None:
        return []

    points = [
        {
            "name": f"District {i}",
            "lat": row.geometry.centroid.y,
            "lon": row.geometry.centroid.x
        }
        for i, (_, row) in enumerate(CURRENT_DISTRICTS.iterrows())
    ]

    # ADD BUDAPEST AS A NODE
    points.append({
        "name": "Budapest",
        "lat": 47.4979,
        "lon": 19.0402
    })

    return points

# -----------------------------
# TREES
# -----------------------------
@app.get("/trees")
def get_trees():
    if CURRENT_DISTRICTS is None:
        return []

    trees = []

    with open("backend/dendro_final.csv", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)

        for row in reader:
            try:
                lat = float(row["lat"])
                lon = float(row["lon"])
                point = Point(lon, lat)

                for _, district in CURRENT_DISTRICTS.iterrows():
                    if district.geometry.contains(point):
                        trees.append({"lat": lat, "lon": lon})
                        break

            except:
                continue

    return trees

# -----------------------------
# DISTANCE FUNCTION
# -----------------------------
def haversine(lat1, lon1, lat2, lon2):
    R = 6371

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)

    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = (
        math.sin(dphi/2)**2 +
        math.cos(phi1) * math.cos(phi2) *
        math.sin(dlambda/2)**2
    )

    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))

# -----------------------------
# MOVE SYSTEM (FURGON LOGIC)
# -----------------------------
class MoveRequest(BaseModel):
    lat: float
    lon: float

@app.post("/move")
def move(req: MoveRequest):

    cost = haversine(
        game.player_lat,
        game.player_lon,
        req.lat,
        req.lon
    )

    if not game.can_move(cost):
        return {
            "success": False,
            "reason": "Not enough furgon",
            "furgon": game.furgon,
            "cost": cost,
            "player_lat": game.player_lat,
            "player_lon": game.player_lon
        }

    game.move_player(req.lat, req.lon, cost)

    return {
        "success": True,
        "furgon": game.furgon,
        "player_lat": game.player_lat,
        "player_lon": game.player_lon,
        "cost": cost
    }