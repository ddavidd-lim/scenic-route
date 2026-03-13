import osmium
from osmium import osm, filter
from osmium.filter import TagFilter
import h3
import json

water_data = json.load(open("constants/water_tags.json"))
water_tags = [v for (k, v) in water_data]

vegetation_data = json.load(open("constants/vegetation_tags.json"))
vegetation_tags = [v for (k, v) in vegetation_data]

geological_data = json.load(open("constants/natural_geology_related_tags.json"))
geological_tags = [v for (k, v) in geological_data]

waterway_data = json.load(open("constants/waterway_tags.json"))
waterway_tags = [v for (k, v) in waterway_data]

print(f"Water tags: {water_tags}")
print(f"Vegetation tags: {vegetation_tags}")
print(f"Geological tags: {geological_tags}")
print(f"Waterway tags: {waterway_tags}")

class ScenicHandler(osmium.SimpleHandler):
    def __init__(self, resolution=8):
        super().__init__()
        self.resolution = resolution
        self.cells = {}  # h3_cell_id -> dict of counts

    def _get_cell(self, lat, lng):
        # Get the H3 cell for the given lat/lng, creating an entry if it doesn't exist.
        cell = h3.latlng_to_cell(lat, lng, self.resolution)
        if cell not in self.cells:
            self.cells[cell] = {
                "water": 0,
                "landcover": 0,
                "relief": 0,
                "recreation": 0,
                "viewpoint": 0,
                "urban": 0,
            }
        return self.cells[cell]

    def node(self, n: osm.Node):
        if not n.location.valid():
            return
        lat, lng = n.location.lat, n.location.lon
        tags = n.tags

        if tags.get("tourism") == "viewpoint":
            self._get_cell(lat, lng)["viewpoint"] += 1
        elif tags.get("natural") == "peak":
            self._get_cell(lat, lng)["relief"] += 1

    def way(self, w: osm.Way):
        # Only handle linear water features here — forests/parks/urban are
        # closed ways that osmium also sends to area(), so we handle them
        # there to avoid double-counting.
        tags = w.tags
        if not (
            tags.get("natural") in water_tags or tags.get("waterway") in waterway_tags
        ):
            return

        nodes = [n for n in w.nodes if n.location.valid()]
        if not nodes:
            return
        lat = sum(n.location.lat for n in nodes) / len(nodes)
        lng = sum(n.location.lon for n in nodes) / len(nodes)
        self._get_cell(lat, lng)["water"] += 1

    def area(self, a: osm.Area):
        tags = a.tags

        if tags.get("landuse") == "forest" or tags.get("natural") in vegetation_tags:
            feature = "landcover"
        elif (
            tags.get("leisure") in ("park", "nature_reserve")
            or tags.get("boundary") == "protected_area"
        ):
            feature = "recreation"
        elif tags.get("landuse") in ("industrial", "commercial"):
            feature = "urban"
        elif tags.get("natural") in geological_tags:
            feature = "relief"
        else:
            return

        try:
            outer = next(a.outer_rings())
            nodes = [n for n in outer if n.location.valid()]
            if not nodes:
                return

            outer_coords = [(n.location.lat, n.location.lon) for n in nodes]
            holes = [
                [(n.location.lat, n.location.lon) for n in ring if n.location.valid()]
                for ring in a.inner_rings(outer)
            ]

            polygon = h3.LatLngPoly(outer_coords, *holes)
            touched = h3.polygon_to_cells(polygon, self.resolution)

            if not touched:
                # Area too small to fill any cell — fall back to centroid
                lat = sum(n.location.lat for n in nodes) / len(nodes)
                lng = sum(n.location.lon for n in nodes) / len(nodes)
                touched = [h3.latlng_to_cell(lat, lng, self.resolution)]

        except (StopIteration, AttributeError):
            return

        for cell in touched:
            if cell not in self.cells:
                self.cells[cell] = {
                    "water": 0,
                    "landcover": 0,
                    "relief": 0,
                    "recreation": 0,
                    "viewpoint": 0,
                    "urban": 0,
                }
            self.cells[cell][feature] += 1
