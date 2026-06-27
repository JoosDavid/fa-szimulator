from pathlib import Path

import geopandas as gpd

BASE_DIR = Path(__file__).resolve().parent

DISTRICTS = gpd.read_file(BASE_DIR / "hungary_level7.shp")
DISTRICTS = DISTRICTS.to_crs(epsg=4326)

DISTRICTS = DISTRICTS.reset_index(drop=True)
DISTRICTS["district_id"] = DISTRICTS.index

def get_random_districts(n=6):
    return DISTRICTS.sample(n)

def get_polygon(row):
    return row.geometry