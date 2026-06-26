import json
import random
from pathlib import Path

from fastapi import APIRouter


router = APIRouter(prefix="/quiz", tags=["quiz"])

DATA_DIR = Path(__file__).parent / "data"

STORIES_PATH = DATA_DIR / "notable_tree_stories_TEST_5.jsonl"
QUIZ_PATH = DATA_DIR / "quiz_questions_manual_TEST_5.jsonl"


def read_jsonl(path: Path):
    items = []

    with path.open("r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                items.append(json.loads(line))

    return items


@router.get("/stories")
def get_notable_tree_stories():
    stories = read_jsonl(STORIES_PATH)

    return [
        {
            "supplyId": row["supplyId"],
            "hungarian": row["hungarian"],
            "latin": row["latin"],
            "story_title": row["story_title"],
            "story_text": row["story_text"],
            "district": row.get("district"),
            "street": row.get("street"),
            "lat": row.get("lat"),
            "lon": row.get("lon"),
            "webpage": row.get("webpage"),
        }
        for row in stories
    ]


@router.get("/questions")
def get_quiz_questions(limit: int = 10):
    questions = read_jsonl(QUIZ_PATH)
    random.shuffle(questions)

    questions = questions[:limit]

    return [
        {
            "supplyId": row["supplyId"],
            "hungarian": row["hungarian"],
            "latin": row["latin"],
            "story_title": row["story_title"],
            "question": row["question"],
            "options": {
                "A": row["option_A"],
                "B": row["option_B"],
                "C": row["option_C"],
                "D": row["option_D"],
            },
            "correct_option": row["correct_option"],
            "correct_answer": row["correct_answer"],
            "explanation": row["explanation"],
            "difficulty": row.get("difficulty"),
            "question_type": row.get("question_type"),
        }
        for row in questions
    ]