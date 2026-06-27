import pygame

from ui.ui_element import UIElement


class Button(UIElement):

    def __init__(self,rect,text,callback,color=(100, 100, 100)):
        super().__init__(rect)

        self.text = text
        self.callback = callback
        self.color = color

        self.font = pygame.font.Font(None,32)

    def draw(self, screen):
        pygame.draw.rect(screen,self.color,self.rect)

        text_surface = self.font.render(self.text,True,(255, 255, 255))

        text_rect = text_surface.get_rect(center=self.rect.center)

        screen.blit(text_surface,text_rect)

    def handle_event(self, event):
        if event.type == pygame.MOUSEBUTTONDOWN:
            if self.rect.collidepoint(event.pos):
                if self.callback:
                    self.callback()


class IconButton(UIElement):

    def __init__(self,image,pos,callback):

        self.image = image

        rect = image.get_rect(topleft=pos)

        super().__init__(rect)

        self.callback = callback

    def draw(self, screen):

        screen.blit(self.image,self.rect)

    def handle_event(self, event):
        if event.type == pygame.MOUSEBUTTONDOWN:
            if self.rect.collidepoint(event.pos):
                if self.callback:
                    self.callback()