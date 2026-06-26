class GameState:

    def __init__(self):
        self.day = 1
        self.hour = 8
        self.minute = 0

        self.elegedettseg = 1000
        self.szakertelem = 500
        self.furgon = 1000

    def next_turn(self):

        # time progression (30 min per turn)
        self.minute += 30

        while self.minute >= 60:
            self.minute -= 60
            self.hour += 1

        while self.hour >= 24:
            self.hour -= 24
            self.day += 1

        # resource changes per turn
        self.elegedettseg -= 1
        self.szakertelem += 1

    def get_time(self):
        return f"Day {self.day} - {self.hour:02d}:{self.minute:02d}"