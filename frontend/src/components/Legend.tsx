type Props = {
  extruded: boolean;
  setExtruded: (value: boolean) => void;
  minScore: number;
  setMinScore: (value: number) => void;
  numCells: number;
};
export default function Legend({ extruded, setExtruded, minScore, setMinScore, numCells }: Props) {
  return (
    <>
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
            onClick={() => setExtruded(!extruded)}
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
          {numCells.toLocaleString()} cells visible
        </div>
      </div>
    </>
  );
}
