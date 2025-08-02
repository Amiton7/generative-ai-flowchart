import React from "react";
import { getStripLayout } from "./utils/stripLayout";

export default function UseCaseStrips({
  useCases,
  minYear,
  maxYear,
  flowTransform = { x: 0, y: 0, zoom: 1 },
  whiteboardHeight,
  axisWidth,
}) {
  const gap = 240;
  const margin = 60;
  const effectiveAxisWidth =
    axisWidth || (maxYear - minYear) * gap + margin * 2;

  // Use the utility to get strip positions
  const strips = getStripLayout(useCases, whiteboardHeight);

  return (
    <svg
      width={effectiveAxisWidth}
      height={whiteboardHeight}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 1,
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      <g transform={`translate(${flowTransform.x},${flowTransform.y}) scale(${flowTransform.zoom})`}>
        {strips.map(({ useCase, top, height }, i) => (
          <g key={useCase}>
            <rect
              x={0}
              y={top}
              width={effectiveAxisWidth}
              height={height}
              fill={i % 2 ? "#f8fafc" : "#f1f5f9"}
              stroke="#e2e8f0"
              strokeWidth={1}
            />
            {i < strips.length - 1 && (
              <line
                x1={0}
                y1={top + height}
                x2={effectiveAxisWidth}
                y2={top + height}
                stroke="#e2e8f0"
                strokeWidth={1}
              />
            )}
          </g>
        ))}
      </g>
    </svg>
  );
}
