from fastapi import FastAPI
from backend.game_state import GameState
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from shapely.geometry import Point
from backend.geo import get_random_districts, DISTRICTS
import csv

app = FastAPI()

app.mount(
    "/static",
    StaticFiles(directory="frontend"),
    name="static"
)

@app.get("/")
def home():
    return FileResponse("frontend/index.html")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

    return {
        "time": game.get_time(),
        "elegedettseg": game.elegedettseg,
        "szakertelem": game.szakertelem,
        "furgon": game.furgon
    }


# ----------------------------------
# TREES FROM CSV
# ----------------------------------

CURRENT_DISTRICTS = None

@app.get("/touring/start")
def start_touring():

    global CURRENT_DISTRICTS

    CURRENT_DISTRICTS = get_random_districts(10)

    return {
        "count": len(CURRENT_DISTRICTS),
        "names": CURRENT_DISTRICTS["name"].tolist()
    }

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

                # check against ALL sampled districts
                for _, district in CURRENT_DISTRICTS.iterrows():

                    if district.geometry.contains(point):

                        trees.append({
                            "lat": lat,
                            "lon": lon
                        })
                        break  # avoid duplicates

            except:
                continue

    print("Trees returned:", len(trees))

    return trees