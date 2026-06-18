import pygame

from ui.ui_element import UIElement


class Panel(UIElement):

    def __init__(self, rect, color=(40, 40, 40)):
        super().__init__(rect)

        self.color = color

    def draw(self, screen):
        pygame.draw.rect(
            screen,
            self.color,
            self.rect
        )