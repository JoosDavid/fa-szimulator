from ui.panel import Panel

class SideBar(Panel):

    def __init__(self,rect,color=(30, 30, 30)):
        super().__init__(rect,color)

        self.buttons = []

    def add_button(self,button):
        self.buttons.append(button)

    def draw(self,screen):
        super().draw(screen)

        for button in self.buttons:
            button.draw(screen)

    def handle_event(self,event):
        for button in self.buttons:
            button.handle_event(event)