class GameState:

    def __init__(self):
        self.day = 1
        self.hour = 8
        self.minute = 0

        self.elegedettseg = 1000
        self.szakertelem = 500
        self.furgon = 1000

        # PLAYER POSITION
        self.player_lat = 47.4979
        self.player_lon = 19.0402

        self.budapest_lat = 47.4979
        self.budapest_lon = 19.0402

    def reset_touring(self):
        self.furgon = 1000
        self.reset_position()
    
    def reset_position(self):
        self.player_lat = self.budapest_lat
        self.player_lon = self.budapest_lon

    def can_move(self, cost):
        return cost <= self.furgon

    def move_player(self, lat, lon, cost):

        # safety check (single source of truth)
        if not self.can_move(cost):
            return False

        self.furgon -= cost
        self.player_lat = lat
        self.player_lon = lon
        return True

    def next_turn(self):
        self.minute += 30

        while self.minute >= 60:
            self.minute -= 60
            self.hour += 1

        while self.hour >= 24:
            self.hour -= 24
            self.day += 1

        self.elegedettseg -= 1
        self.szakertelem += 1

    def get_time(self):
        return f"Day {self.day} - {self.hour:02d}:{self.minute:02d}"