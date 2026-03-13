from collections import defaultdict

import osmium
from osmium import osm
import h3

LEISURE_RECREATION_TAGS = {"park", "garden", "nature_reserve"}

LANDUSE_URBAN_TAGS = {
    "residential",
    "commercial",
    "industrial",
    "retail",
    "construction",
    "garages",
    "port",
}

class ScenicHandler(osmium.SimpleHandler):
    """
    Taking into account the water / geology related tags in the natural tags.
    """
    def __init__(self, water_data, vegetation_data, geological_data, waterway_data, resolution=8):
        super().__init__()
        self.resolution = resolution
        self.cells = defaultdict(
            lambda: {
                "water": 0,
                "landcover": 0,
                "relief": 0,
                "recreation": 0,
                "viewpoint": 0,
                "urban": 0,
            }
        )  # h3_cell_id -> dict of counts
        
        self.water_tags = {v for (k, v) in water_data}
        self.vegetation_tags = {v for (k, v) in vegetation_data}
        self.geological_tags = {v for (k, v) in geological_data}
        self.waterway_tags = {v for (k, v) in waterway_data}

        print(f"Water tags: {self.water_tags}")
        print(f"Vegetation tags: {self.vegetation_tags}")
        print(f"Geological tags: {self.geological_tags}")
        print(f"Waterway tags: {self.waterway_tags}")

    def _get_cell(self, lat, lng):
        # Get the H3 cell for the given lat/lng
        cell = h3.latlng_to_cell(lat, lng, self.resolution)

        return self.cells[cell]

    def _score_cell(self, tags, lat, lng):
        tourism = tags.get("tourism")
        natural = tags.get("natural")
        landuse = tags.get("landuse")
        landcover = tags.get("landcover")
        waterway = tags.get("waterway")
        geological = tags.get("geological")
        leisure = tags.get("leisure")
        landuse = tags.get("landuse")
        
        cell = self._get_cell(lat, lng)

        if natural:
            if natural in self.water_tags:
                cell["water"] += 1
            if natural in self.vegetation_tags:
                cell["landcover"] += 1
            if natural in self.geological_tags:
                cell["relief"] += 1

        if waterway:
            cell["water"] += 1

        if geological:
            cell["relief"] += 1

        if tourism == "viewpoint":
            cell["viewpoint"] += 1

        if landuse == "forest":
            cell["landcover"] += 1

        if landcover == "trees":
            cell["landcover"] += 1

        if leisure in LEISURE_RECREATION_TAGS:
            cell["recreation"] += 1

        if landuse in LANDUSE_URBAN_TAGS:
            cell["urban"] += 1

    def node(self, n: osm.Node):
        if not n.location.valid():
            return
        lat, lng = n.location.lat, n.location.lon
        tags = n.tags

        self._score_cell(tags, lat, lng)

    def way(self, w: osm.Way):
        tags = w.tags

        for n in w.nodes:
            if not n.location.valid():
                continue
            lat, lng = n.location.lat, n.location.lon

            self._score_cell(tags, lat, lng)
