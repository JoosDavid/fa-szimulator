class GameTime:

    def __init__(self):

        # Start at day 1, 08:00
        self.day = 1
        self.hour = 8
        self.minute = 0

    def add_minutes(self, minutes):

        self.minute += minutes

        while self.minute >= 60:
            self.minute -= 60
            self.hour += 1

        while self.hour >= 24:
            self.hour -= 24
            self.day += 1

    def add_hours(self, hours):

        self.hour += hours

        while self.hour >= 24:
            self.hour -= 24
            self.day += 1

    def next_turn(self):
        # each turn = 30 mins
        self.add_minutes(30)

    def get_time_string(self):

        h = str(self.hour).zfill(2)
        m = str(self.minute).zfill(2)

        return f"Day {self.day} - {h}:{m}"