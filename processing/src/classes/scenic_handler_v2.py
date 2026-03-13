from collections import defaultdict

import osmium
from osmium import osm
import h3


class ScenicHandler(osmium.SimpleHandler):
    """
    More basic implementation of a handler using only nodes and ways.
    Will not consider overlap.
    """

    def __init__(self, resolution=8):
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

    def _get_cell(self, lat, lng):
        # Get the H3 cell for the given lat/lng
        cell = h3.latlng_to_cell(lat, lng, self.resolution)

        return self.cells[cell]

    def _score_cell(self, tags, lat, lng):
        match tags.get("tourism"):
            case "viewpoint":
                self._get_cell(lat, lng)["viewpoint"] += 1

        match tags.get("natural"):
            case "peak":
                self._get_cell(lat, lng)["viewpoint"] += 1
            case _:
                self._get_cell(lat, lng)["landcover"] += 1

        match tags.get("landuse"):
            case "forest":
                self._get_cell(lat, lng)["landcover"] += 1
            case _:
                self._get_cell(lat, lng)["urban"] += 1

        if tags.get("landcover") == "trees":
            self._get_cell(lat, lng)["landcover"] += 1

        if tags.get("waterway"):
            self._get_cell(lat, lng)["water"] += 1

        if tags.get("geological"):
            self._get_cell(lat, lng)["relief"] += 1

        match tags.get("leisure"):
            case "park":
                self._get_cell(lat, lng)["recreation"] += 1
            case "garden":
                self._get_cell(lat, lng)["recreation"] += 1

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
