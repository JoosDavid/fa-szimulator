class GameState:
    def __init__(self):
        self.day = 1
        self.hour = 8
        self.minute = 0

        self.elegedettseg = 1000
        self.szakertelem = 0
        self.furgon = 1000

        self.quiz_used_this_turn = False
        self.quiz_correct_rewards_this_turn = 0
        self.max_quiz_rewards_per_turn = 5

        self.touring_goal = 1200
        self.touring_unlocked = False

        # PLAYER POSITION
        self.player_lat = 47.4979
        self.player_lon = 19.0402

        self.budapest_lat = 47.4979
        self.budapest_lon = 19.0402

        self.visited_districts = set()
        self.current_districts = None

    def update_touring_unlock(self):
        if self.elegedettseg >= self.touring_goal:
            self.touring_unlocked = True

    def reset_touring(self):
        self.furgon = 1000
        self.reset_position()

    def reset_position(self):
        self.player_lat = self.budapest_lat
        self.player_lon = self.budapest_lon

    def can_move(self, cost):
        return cost <= self.furgon

    def move_player(self, lat, lon, cost):
        if not self.can_move(cost):
            return False

        self.furgon -= cost
        self.player_lat = lat
        self.player_lon = lon
        return True

    def start_quiz(self):
        if self.quiz_used_this_turn:
            return False

        self.quiz_used_this_turn = True
        self.quiz_correct_rewards_this_turn = 0
        return True

    def reward_quiz_correct_answer(self):
        if not self.quiz_used_this_turn:
            return False

        if self.quiz_correct_rewards_this_turn >= self.max_quiz_rewards_per_turn:
            return False

        self.szakertelem += 1
        self.quiz_correct_rewards_this_turn += 1
        return True

    def next_turn(self, incomplete_missions_count):
        self.minute += 30

        while self.minute >= 60:
            self.minute -= 60
            self.hour += 1

        while self.hour >= 24:
            self.hour -= 24
            self.day += 1

        # Penalty: -10 elégedettség for every incomplete mission
        penalty = incomplete_missions_count * 10
        self.elegedettseg -= penalty

        # New turn rules
        self.szakertelem = 0
        self.quiz_used_this_turn = False
        self.quiz_correct_rewards_this_turn = 0

        self.update_touring_unlock()

        return {
            "incomplete_missions": incomplete_missions_count,
            "penalty": penalty,
        }

    def get_time(self):
        return f"Day {self.day} - {self.hour:02d}:{self.minute:02d}"