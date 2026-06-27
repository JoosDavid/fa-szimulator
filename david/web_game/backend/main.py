from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

import json

from functools import lru_cache
from pathlib import Path
from fastapi import HTTPException

from shapely.geometry import Point
import csv
from backend.quiz import router as quiz_router

from backend.game_state import GameState
from backend.geo import DISTRICTS

app = FastAPI()

# -----------------------------
# STATIC FRONTEND
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


@app.get("/state")
def get_state():
    return {
        "time": game.get_time(),
        "elegedettseg": game.elegedettseg,
        "szakertelem": game.szakertelem,
        "furgon": game.furgon
    }


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
# -----------------------------
# TOURING STATE (SEPARATE FROM GAME)
# -----------------------------
CURRENT_DISTRICTS = None


@app.get("/touring/start")
def start_touring():

    global CURRENT_DISTRICTS

    # sample 10 districts
    CURRENT_DISTRICTS = DISTRICTS.sample(10).copy()

    # ensure correct CRS
    CURRENT_DISTRICTS = CURRENT_DISTRICTS.to_crs(epsg=4326)

    return {
        "count": len(CURRENT_DISTRICTS)
    }


@app.get("/touring/districts")
def get_districts():

    global CURRENT_DISTRICTS

    if CURRENT_DISTRICTS is None:
        return {"type": "FeatureCollection", "features": []}

    return {
        "type": "FeatureCollection",
        "features": CURRENT_DISTRICTS.__geo_interface__["features"]
    }


@app.get("/touring/centroids")
def get_centroids():

    global CURRENT_DISTRICTS

    if CURRENT_DISTRICTS is None:
        return []

    return [
        {
            "lat": row.geometry.centroid.y,
            "lon": row.geometry.centroid.x
        }
        for _, row in CURRENT_DISTRICTS.iterrows()
    ]


@app.get("/trees")
def get_trees():

    global CURRENT_DISTRICTS

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

                # check if inside ANY of the 10 sampled districts
                for _, district in CURRENT_DISTRICTS.iterrows():

                    if district.geometry.contains(point):

                        trees.append({
                            "lat": lat,
                            "lon": lon
                        })
                        break

            except Exception as e:
                print("Error:", e)

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