import pygame
from ui import UIManager, SideBar, Button, ResourceBar, GameTime, TimeDisplay

pygame.init()

WIDTH = 1920
HEIGHT = 1080

screen = pygame.display.set_mode((WIDTH, HEIGHT))
clock = pygame.time.Clock()

def open_profile():
    print("Profile clicked")

def open_missions():
    print("Mission clicked")

ui = UIManager()

sidebar = SideBar((0, 0, 200, HEIGHT))
profile_btn = Button((20, 20, 160, 50),"Profile",open_profile)
mission_btn = Button((20, 90, 160, 50),"Missions",open_missions)
sidebar.add_button(profile_btn)
sidebar.add_button(mission_btn)

resource_bar = ResourceBar((200, 0, WIDTH - 200, 50))

game_time = GameTime()
time_display = TimeDisplay((500, 0, 250, 50),game_time)

ui.add(time_display)
ui.add(sidebar)
ui.add(resource_bar)


running = True

while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        ui.handle_event(event)

    screen.fill((70, 120, 70))
    # map.draw(screen) would go here
    ui.draw(screen)
    pygame.display.flip()

    clock.tick(60)

pygame.quit()