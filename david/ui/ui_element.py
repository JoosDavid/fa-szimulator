import pygame


class UIElement:

    def __init__(self, rect):
        self.rect = pygame.Rect(rect)

    def update(self):
        pass

    def draw(self, screen):
        pass

    def handle_event(self, event):
        pass