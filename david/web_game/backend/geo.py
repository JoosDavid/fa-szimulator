import geopandas as gpd

DISTRICTS = gpd.read_file("backend/hungary_level7.shp")
DISTRICTS = DISTRICTS.to_crs(epsg=4326)

def get_random_districts(n=6):
    return DISTRICTS.sample(n)

def get_polygon(row):
    return row.geometry