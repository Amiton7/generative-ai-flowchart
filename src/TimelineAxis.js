import React from "react";

const MONTHS = ["Jan", "Apr", "Jul", "Oct"];

export default function TimelineAxis({
  minYear = 1986,
  maxYear = 2025,
  flowTransform = { x: 0, y: 0, zoom: 1 },
  whiteboardWidth = 1200,
  height = 40
}) {
  const gap = 240; // px per year, must match FlowChart.js
  const years = [];
  for (let y = minYear; y <= maxYear; ++y) years.push(y);

  const scale = flowTransform.zoom || 1;
  const offsetX = flowTransform.x || 0;
  const showMonths = scale > 0.55;
  const shortYear = scale < 0.55;

  const yearToX = (year) => (year - minYear) * gap + 60;

  return (
    <div
      style={{
        width: "100%",
        height: height,
        background: "#e5e7eb",
        overflow: "hidden",
        pointerEvents: "none",
        borderTop: "1px solid #d1d5db",
        position: "relative"
      }}
    >
      <svg width={whiteboardWidth} height={height}>
        {/* Axis line */}
        <line
          x1={0}
          y1={height}
          x2={whiteboardWidth}
          y2={height}
          stroke="#64748b"
          strokeWidth="2"
        />
        {/* Year and month ticks */}
        {years.map((year) => {
          const x = yearToX(year) * scale + offsetX;
          if (x < -50 || x > whiteboardWidth + 50) return null;
          return (
            <g key={year}>
              {/* Year tick upwards */}
              <line x1={x} y1={height} x2={x} y2={height - 18} stroke="#64748b" strokeWidth="2" />
              <text
                x={x}
                y={height - 22}
                textAnchor="middle"
                fontSize="11"
                fontFamily="Inter"
                fill="#64748b"
                style={{ userSelect: "none", fontWeight: 500 }}
              >
                {shortYear ? `'${String(year).slice(2)}` : year}
              </text>
              {/* Months upwards */}
              {showMonths && MONTHS.map((m, i) => {
                if (i === 0) return null;
                const monthX = x + (gap * (i / 4)) * scale;
                if (monthX < -30 || monthX > whiteboardWidth + 30) return null;
                return (
                  <g key={m}>
                    <line
                      x1={monthX}
                      y1={height}
                      x2={monthX}
                      y2={height - 10}
                      stroke="#64748b"
                      strokeWidth="1"
                    />
                    <text
                      x={monthX}
                      y={height - 12}
                      textAnchor="middle"
                      fontSize="9"
                      fontFamily="Inter"
                      fill="#64748b"
                      style={{
                        userSelect: "none",
                        fontWeight: 400,
                        opacity: 0.8
                      }}
                    >
                      {m}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
