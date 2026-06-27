class UIManager:

    def __init__(self):
        self.elements = []

    def add(self,element):
        self.elements.append(element)

    def update(self):
        for element in self.elements:
            element.update()

    def draw(self,screen):
        for element in self.elements:
            element.draw(screen)

    def handle_event(self,event):
        for element in self.elements:
            element.handle_event(event)

    def is_mouse_over_ui(self,pos):
        for element in self.elements:
            if element.rect.collidepoint(pos):
                return True

        return False