# scenic-route

A geospatial pipeline that scores and visualizes the scenic quality of locations in California using OpenStreetMap data and H3 hexagonal indexing.

---

## Overview

scenic-route parses raw OSM data, extracts geographic features (water, forests,
mountains, parks, viewpoints), and aggregates them into H3 hexagonal cells. Each
cell receives a scenic score based on the presence and diversity of natural
features, penalized for urban/industrial land use. Results are visualized as an
interactive 3D hex map with hover tooltips, score filtering, and deck.gl extrusion.

---

## Setup

### Prerequisites

- Python
- Node.js
- pnpm
- A California OSM extract (`.osm.pbf`)
  
### Install

```bash
# Python dependencies
pip install -r requirements.txt
pip install -e ./processing

# Frontend
pnpm install
```

### Run

```bash
pnpm run dev:frontend
```
