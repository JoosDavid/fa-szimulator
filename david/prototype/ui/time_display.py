import pygame

from ui.ui_element import UIElement

class TimeDisplay(UIElement):
    def __init__(self, rect, game_time):

        super().__init__(rect)

        self.game_time = game_time

        self.font = pygame.font.Font(None, 32)

    def draw(self, screen):
        pygame.draw.rect(screen,(20, 20, 20),self.rect)

        text = self.game_time.get_time_string()

        surface = self.font.render(text,True,(255, 255, 255))

        screen.blit(surface,(self.rect.x + 10, self.rect.y + 10))