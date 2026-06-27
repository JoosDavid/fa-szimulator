from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

import json

from functools import lru_cache
from pathlib import Path
from fastapi import HTTPException

from shapely.geometry import Point
from pydantic import BaseModel
import csv
import math
import pandas as pd

from backend.quiz import router as quiz_router
from backend.game_state import GameState
from backend.geo import DISTRICTS

TREES = pd.read_csv("backend/dendro_final.csv")

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

@app.post("/quiz/correct")
def quiz_correct():
    game.szakertelem += 1
    return {
        "time": game.get_time(),
        "elegedettseg": game.elegedettseg,
        "szakertelem": game.szakertelem,
        "furgon": game.furgon
    }
@app.post("/reset")
def reset():
    game.reset_touring()
    return get_state()

# -----------------------------
# TOURING
# -----------------------------

@app.get("/touring/start")
def start_touring():

    available = DISTRICTS[
        ~DISTRICTS["district_id"].isin(game.visited_districts)
    ]

    if available.empty:
        game.current_districts = None
        game.reset_touring()
        return {
            "finished": True,
            "count": 0
        }

    game.current_districts = available.sample(6).copy()
    game.current_districts = game.current_districts.to_crs(epsg=4326)

    game.reset_touring()

    return {"count": len(game.current_districts)}

@app.get("/touring/districts")
def get_districts():
    if game.current_districts is None:
        return {
            "geojson": {
                "type": "FeatureCollection",
                "features": []
            },
            "visited": list(game.visited_districts)
        }

    return {
        "geojson": {
            "type": "FeatureCollection",
            "features": game.current_districts.__geo_interface__["features"]
        },
        "visited": list(game.visited_districts)
    }

@app.get("/touring/budapest")
def get_budapest():
    return {"lat": 47.4979, "lon": 19.0402}

@app.get("/touring/centroids")
def get_centroids():
    if game.current_districts is None:
        return []

    points = [
        {
            "name": f"District {i}",
            "lat": row.geometry.centroid.y,
            "lon": row.geometry.centroid.x
        }
        for i, (_, row) in enumerate(game.current_districts.iterrows())
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
    if game.current_districts is None:
        return []

    trees = []

    for _, row in TREES.iterrows():
        try:
            lat = float(row["lat"])
            lon = float(row["lon"])
            point = Point(lon, lat)

            for _, district in game.current_districts.iterrows():
                if district.geometry.contains(point):
                    trees.append({"lat": lat, "lon": lon})
                    break
        except:
            continue

    return trees

DATA_DIR = Path(__file__).resolve().parent / "data"
BUDAPEST_TREE_SAMPLE_PATH = DATA_DIR / "budapest_trees_sample_10000.json"


@lru_cache(maxsize=1)
def load_budapest_tree_sample():
    if not BUDAPEST_TREE_SAMPLE_PATH.exists():
        raise HTTPException(
            status_code=404,
            detail="Missing budapest_trees_sample_10000.json. Run backend/create_budapest_tree_sample.py first.",
        )

    with BUDAPEST_TREE_SAMPLE_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


@app.get("/trees/budapest")
def get_budapest_trees():
    return load_budapest_tree_sample()

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

    point = Point(req.lon, req.lat)

    for _, district in game.current_districts.iterrows():
        if district.geometry.contains(point):
            game.visited_districts.add(district["district_id"])
            break

    return {
        "success": True,
        "furgon": game.furgon,
        "player_lat": game.player_lat,
        "player_lon": game.player_lon,
        "cost": cost
    }