import random
from fastapi import APIRouter
from pydantic import BaseModel


MISSION_PROBLEMS_BY_LEVEL = {
    0: [
        {
            "problem": "Öntözni kell",
            "description": "A fa vízhiányosnak tűnik, sürgős öntözésre van szüksége.",
        },
        {
            "problem": "Fiatal fa ellenőrzése",
            "description": "Ellenőrizni kell, hogy a frissen ültetett fa jól fejlődik-e.",
        },
    ],
    1: [
        {
            "problem": "Kiszáradás jelei",
            "description": "A lomb ritkul, a levelek egy része barnul.",
        },
        {
            "problem": "Talajtömörödés",
            "description": "A fa körül a talaj túl tömör, a gyökerek nehezebben jutnak levegőhöz.",
        },
    ],
    2: [
        {
            "problem": "Koronaalakítás szükséges",
            "description": "A koronát rendezni kell, hogy a fa egészségesen fejlődjön.",
        },
        {
            "problem": "Törzsvédelem sérült",
            "description": "A fa törzsét védő szerkezet megsérült vagy hiányzik.",
        },
    ],
    3: [
        {
            "problem": "Letört ág veszélye",
            "description": "Egy sérült ág veszélyeztetheti a járókelőket.",
        },
        {
            "problem": "Gyökérzóna sérülése",
            "description": "A fa körüli gyökérzónában károsodás látható.",
        },
    ],
    4: [
        {
            "problem": "Szú támadás",
            "description": "A törzsön rovarfertőzésre utaló nyomok láthatók.",
        },
        {
            "problem": "Erős lombvesztés",
            "description": "A fa a vártnál sokkal több lombot veszített.",
        },
    ],
    5: [
        {
            "problem": "Gombás fertőzés gyanúja",
            "description": "A kéregen és a törzs körül gombás fertőzésre utaló jelek vannak.",
        },
        {
            "problem": "Komplex faállapot-vizsgálat",
            "description": "A fa állapota többféle problémára utal, szakértői vizsgálat kell.",
        },
    ],
}


class MissionTreeClick(BaseModel):
    tree_id: str


class MissionManager:
    def __init__(self, load_budapest_tree_sample):
        self.load_budapest_tree_sample = load_budapest_tree_sample
        self.active_missions = []

    def make_location_hint(self, tree):
        district = tree.get("district") or "Ismeretlen kerület"
        street = tree.get("street") or "ismeretlen utca"
        street_number = tree.get("streetNumber")

        if street_number:
            return f"{district} kerület, {street} {street_number}"

        return f"{district} kerület, {street}"

    def get_usable_trees(self):
        trees = self.load_budapest_tree_sample()

        return [
            tree for tree in trees
            if tree.get("id")
            and tree.get("lat")
            and tree.get("lon")
            and tree.get("hungarian_name")
            and tree.get("district")
            and tree.get("street")
        ]

    def create_turn_missions(self):
        usable_trees = self.get_usable_trees()

        needed_tree_count = 12

        if len(usable_trees) < needed_tree_count:
            raise ValueError("Not enough usable trees to create missions.")

        selected_trees = random.sample(usable_trees, needed_tree_count)

        missions = []
        tree_index = 0

        for required_level in range(0, 6):
            for copy_index in range(2):
                tree = selected_trees[tree_index]
                tree_index += 1

                problem = random.choice(MISSION_PROBLEMS_BY_LEVEL[required_level])
                reward = (required_level + 1) * 10

                missions.append({
                    "id": f"mission_{required_level}_{copy_index}_{tree['id']}",
                    "problem": problem["problem"],
                    "description": problem["description"],
                    "required_szakertelem": required_level,
                    "reward_elegedettseg": reward,
                    "tree_id": tree["id"],
                    "hungarian_name": tree.get("hungarian_name", "Ismeretlen fa"),
                    "latin_name": tree.get("latin_name", ""),
                    "location_hint": self.make_location_hint(tree),
                    "completed": False,
                })

        random.shuffle(missions)
        return missions

    def ensure_missions_exist(self):
        if not self.active_missions:
            self.active_missions = self.create_turn_missions()

    def start_new_turn(self):
        self.active_missions = self.create_turn_missions()

    def count_incomplete_missions(self):
        self.ensure_missions_exist()

        return sum(
            1 for mission in self.active_missions
            if not mission["completed"]
        )

    def create_router(self, game, get_state):
        router = APIRouter()

        @router.get("/missions")
        def get_missions():
            self.ensure_missions_exist()

            return {
                "missions": self.active_missions,
                "szakertelem": game.szakertelem,
            }

        @router.post("/missions/check_tree")
        def check_mission_tree(req: MissionTreeClick):
            self.ensure_missions_exist()

            for mission in self.active_missions:
                if mission["completed"]:
                    continue

                if mission["tree_id"] == req.tree_id:
                    if game.szakertelem < mission["required_szakertelem"]:
                        return {
                            "success": False,
                            "reason": "Nincs elég szakértelmed ehhez a problémához.",
                            "required_szakertelem": mission["required_szakertelem"],
                            "current_szakertelem": game.szakertelem,
                            "mission": mission,
                            "state": get_state(),
                        }

                    mission["completed"] = True

                    game.elegedettseg += mission["reward_elegedettseg"]
                    game.update_touring_unlock()

                    return {
                        "success": True,
                        "message": "Küldetés teljesítve!",
                        "mission": mission,
                        "reward_elegedettseg": mission["reward_elegedettseg"],
                        "state": get_state(),
                    }

            return {
                "success": False,
                "reason": "Ez nem egy aktív küldetés fája.",
                "state": get_state(),
            }

        return router