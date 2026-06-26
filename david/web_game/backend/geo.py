import geopandas as gpd
import random

DISTRICTS = gpd.read_file("backend/hungary_level7.shp")
DISTRICTS = DISTRICTS.to_crs(epsg=4326)

def get_random_districts(n=10):
    return DISTRICTS.sample(n)

def get_polygon(row):
    return row.geometry