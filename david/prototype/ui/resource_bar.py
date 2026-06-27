import pygame

from ui.panel import Panel


class ResourceBar(Panel):

    def __init__(self,rect):
        super().__init__(rect,(60, 60, 60))

        self.elegedettseg = 1000
        self.szakertelem = 500
        self.furgon = 200

        self.font = pygame.font.Font(None,30)

    def draw(self,screen):
        super().draw(screen)

        text = (
            f"Lakossági elégedettség: {self.elegedettseg}    "
            f"Szakértelem: {self.szakertelem}    "
            f"Furgon töltöttsége: {self.furgon}"
        )

        text_surface = self.font.render(text,True,(255, 255, 255))

        screen.blit(text_surface,(self.rect.x + 10,self.rect.y + 10))