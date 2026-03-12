import { useState, useCallback } from "react";
import DeckGL from "@deck.gl/react";
import { H3HexagonLayer } from "@deck.gl/geo-layers";
import Map from "react-map-gl/maplibre";
import { rgb } from "d3-color";
import { interpolateRdYlGn } from "d3-scale-chromatic";
import data from "../data/scenic_scores.json";
import maplibregl from "maplibre-gl";

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
  forest: number;
  peak: number;
  park: number;
  viewpoint: number;
  urban: number;
  diversity: number;
  raw_score: number;
  score: number;
};
export default function ScenicMap() {
  const [extruded, setExtruded] = useState(true);
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
          <div>⛰️ Peaks &nbsp;&nbsp;&nbsp;${object.peak ?? 0}</div>
          <div>🌲 Forest &nbsp;&nbsp;${object.forest ?? 0}</div>
          <div>💧 Water &nbsp;&nbsp;&nbsp;${object.water ?? 0}</div>
          <div>🌿 Parks &nbsp;&nbsp;&nbsp;${object.park ?? 0}</div>
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
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      {/* Controls */}
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 10,
          background: "rgba(10,15,26,0.88)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 10,
          padding: "14px 16px",
          backdropFilter: "blur(12px)",
          fontFamily: "monospace",
          fontSize: 12,
          color: "#c0c0c0",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          minWidth: 200,
        }}
      >
        {/* 3D toggle */}
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <div
            onClick={() => setExtruded((v) => !v)}
            style={{
              width: 36,
              height: 20,
              borderRadius: 10,
              background: extruded ? "#4caf7d" : "#333",
              position: "relative",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 3,
                left: extruded ? 18 : 3,
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: "#fff",
                transition: "left 0.2s",
              }}
            />
          </div>
          3D Extrusion
        </label>

        {/* Score filter */}
        <div>
          <div style={{ marginBottom: 5, color: "#7a9e88" }}>
            Min score: <span style={{ color: "#f0f0f0" }}>{minScore}</span>
          </div>
          <input
            type="range"
            min={0}
            max={80}
            step={5}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#4caf7d", cursor: "pointer" }}
          />
        </div>

        {/* Legend */}
        <div>
          <div style={{ marginBottom: 5, color: "#7a9e88" }}>Score</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span>0</span>
            <div
              style={{
                flex: 1,
                height: 8,
                borderRadius: 4,
                background: "linear-gradient(to right, #d73027, #fee08b, #1a9850)",
              }}
            />
            <span>100</span>
          </div>
        </div>

        {/* Cell count */}
        <div
          style={{
            color: "#7a9e88",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: 10,
          }}
        >
          {filtered.length.toLocaleString()} cells visible
        </div>
      </div>

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
        />
      </DeckGL>
    </div>
  );
}
