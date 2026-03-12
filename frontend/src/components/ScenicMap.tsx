import { H3HexagonLayer } from "@deck.gl/geo-layers";
import DeckGL from "@deck.gl/react";
import { rgb } from "d3-color";
import { interpolateRdYlGn } from "d3-scale-chromatic";
import maplibregl from "maplibre-gl";
import { useCallback, useState } from "react";
import Map from "react-map-gl/maplibre";
import data from "../data/scenic_scores.json";
import Legend from "./Legend";

const INITIAL_VIEW = {
  longitude: -119.5,
  latitude: 37.5,
  zoom: 6,
  pitch: 45,
  bearing: 0,
};

function getColor(score: number, opacity = 190): [number, number, number, number] {
  const c = rgb(interpolateRdYlGn(score / 100));
  return [c.r, c.g, c.b, opacity];
}

// ['h3_cell', 'water', 'forest', 'peak', 'park', 'viewpoint', 'urban', 'diversity', 'raw_score', 'score']
type H3CellData = {
  h3_cell: string;
  water: number;
  landcover: number;
  relief: number;
  recreation: number;
  viewpoint: number;
  urban: number;
  diversity: number;
  raw_score: number;
  score: number;
};
export default function ScenicMap() {
  const [extruded, setExtruded] = useState(false);
  const [minScore, setMinScore] = useState(0);
  const [hovered, setHovered] = useState<H3CellData | null>(null);

  const filtered = (data as H3CellData[]).filter((d) => d.score >= minScore);

  const layer = new H3HexagonLayer({
    id: "scenic-hex",
    data: filtered,
    getHexagon: (d: H3CellData) => d.h3_cell,
    getFillColor: (d: H3CellData) => getColor(d.score, hovered?.h3_cell === d.h3_cell ? 255 : 190),
    getElevation: (d: H3CellData) => d.score * 80,
    elevationScale: extruded ? 8 : 0,
    extruded,
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 60],
    onHover: (info: { object: H3CellData | null }) => setHovered(info.object ?? null),
    updateTriggers: {
      getFillColor: [hovered],
    },
  });

  const getTooltip = useCallback(({ object }: { object: H3CellData | null }) => {
    if (!object) return null;
    return {
      html: `
        <div style="font-family:monospace; font-size:12px; line-height:1.8">
          <div style="font-size:14px; font-weight:700; color:#a8e6a3; margin-bottom:4px">
            Score: ${object.score.toFixed(1)}
          </div>
          <div>⛰️ Relief &nbsp;&nbsp;&nbsp;${object.relief ?? 0}</div>
          <div>🌲 Landcover &nbsp;&nbsp;${object.landcover ?? 0}</div>
          <div>💧 Water &nbsp;&nbsp;&nbsp;${object.water ?? 0}</div>
          <div>🌿 Recreation &nbsp;&nbsp;&nbsp;${object.recreation ?? 0}</div>
          <div>👁️ Views &nbsp;&nbsp;&nbsp;${object.viewpoint ?? 0}</div>
          ${
            object.urban > 0
              ? `<div style="color:#ff8a80">🏭 Urban &nbsp;&nbsp;&nbsp;${object.urban}</div>`
              : ""
          }
        </div>
      `,
      style: {
        background: "rgba(10, 15, 26, 0.92)",
        border: "1px solid rgba(168,230,163,0.25)",
        borderRadius: "8px",
        padding: "10px 13px",
      },
    };
  }, []);

  return (
    <div className="w-full h-screen">
      <Legend
        extruded={extruded}
        setExtruded={setExtruded}
        minScore={minScore}
        setMinScore={setMinScore}
        numCells={filtered.length}
      />
      {/* Map */}
      <DeckGL
        initialViewState={INITIAL_VIEW}
        controller={true}
        layers={[layer]}
        getTooltip={getTooltip}
        glOptions={{ webgl2: true }}
      >
        <Map
          mapLib={maplibregl}
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
          attributionControl={false}
          style={{ width: "100%", height: "100%" }}
        >
          {/* <AttributionControl compact={true} position="top-left" /> */}
        </Map>
      </DeckGL>
    </div>
  );
}
