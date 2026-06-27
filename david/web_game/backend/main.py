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

import math
import pandas as pd

from backend.quiz import router as quiz_router
from backend.game_state import GameState
from backend.geo import DISTRICTS
from backend.missions import MissionManager


TREES = pd.read_csv("backend/dendro_final.csv")

@lru_cache(maxsize=1)
def load_budapest_tree_sample():
    if not BUDAPEST_TREE_SAMPLE_PATH.exists():
        raise HTTPException(
            status_code=404,
            detail="Missing budapest_trees_sample_10000.json. Run backend/create_budapest_tree_sample.py first.",
        )

    with BUDAPEST_TREE_SAMPLE_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)

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

mission_manager = MissionManager(load_budapest_tree_sample)


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
        "player_lon": game.player_lon,
        "quiz_used_this_turn": game.quiz_used_this_turn,
        "quiz_correct_rewards_this_turn": game.quiz_correct_rewards_this_turn,
        "touring_goal": game.touring_goal,
        "touring_unlocked": game.touring_unlocked,
    }


app.include_router(
        mission_manager.create_router(
            game=game,
            get_state=get_state,
        )
    )

# -----------------------------
# TIME
# -----------------------------
@app.post("/end_turn")
def end_turn():
    incomplete_count = mission_manager.count_incomplete_missions()

    turn_summary = game.next_turn(
        incomplete_missions_count=incomplete_count
    )

    mission_manager.start_new_turn()

    state = get_state()
    state["turn_summary"] = turn_summary

    return state

@app.post("/quiz/start")
def quiz_start():
    allowed = game.start_quiz()

    if not allowed:
        return {
            "allowed": False,
            "reason": "Ebben a körben már volt móka.",
            "state": get_state(),
        }

    return {
        "allowed": True,
        "state": get_state(),
    }

@app.post("/quiz/correct")
@app.post("/quiz/correct")
def quiz_correct():
    rewarded = game.reward_quiz_correct_answer()

    if not rewarded:
        return {
            "success": False,
            "reason": "Ebben a körben már nem kaphatsz több szakértelmet a mókából.",
            "state": get_state(),
        }

    return {
        "success": True,
        "state": get_state(),
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

    if not game.touring_unlocked:
        return {
            "success": False,
            "reason": f"A túrázáshoz legalább {game.touring_goal} elégedettség kell.",
            "state": get_state(),
        }

    CURRENT_DISTRICTS = DISTRICTS.sample(6).copy()
    CURRENT_DISTRICTS = CURRENT_DISTRICTS.to_crs(epsg=4326)

    game.reset_touring()

    return {
        "success": True,
        "count": len(CURRENT_DISTRICTS),
        "state": get_state(),
    }

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

app.include_router(
    mission_manager.create_router(
        game=game,
        get_state=get_state,
    )
)