from fastapi import FastAPI
import json
from backend.game_state import GameState
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

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
        "status": "ok",
        "state": get_state()
    }

with open("backend/hun_trees.json", "r", encoding="utf-8") as f:
    TREES = json.load(f)


@app.get("/trees")
def get_trees():
    return TREES