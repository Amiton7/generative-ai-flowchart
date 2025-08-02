import React, { useState, useRef, useEffect } from "react";
import models from "./models";
import TimelineAxis from "./TimelineAxis";
import UseCaseStrips from "./UseCaseStrips";
import ModelListSidebar from './ModelListSidebar';

const USE_CASES = ["Text", "Image", "Video", "Audio", "Tabular"];
const TIMELINE_HEIGHT = 48;
const BOARD_HEIGHT = 700*0.85; // compact
const NODE_HEIGHT = 16;
const LABEL_COL_WIDTH = 104; // width of frozen left label column
const margin = 36; // right margin inside scroll area (padding)

const minDate = new Date("1986-01-01");
const maxDate = new Date("2025-07-31"); // End exactly at July 2025
const gap = 240;
const months = (maxDate.getFullYear() - minDate.getFullYear()) * 12 + (maxDate.getMonth() - minDate.getMonth());
const timelineWidth = months * gap / 12;
const EMOJIS = {
  Text: "✏️",
  Image: "🖼️",
  Video: "🎬",
  Audio: "🎶",
  Tabular: "📊"
};
// const EMOJIS = { Text: "📝", Image: "🖼️", Video: "🎬", Audio: "🎧", Tabular: "📊" };

function dateToX(date, minDate, maxDate, width) {
  const d = new Date(date);
  const d0 = new Date(minDate);
  const d1 = new Date(maxDate);
  const frac = Math.max(0, Math.min(1, (d - d0) / (d1 - d0)));
  return frac * width;
}

const FIELD_CONFIG = [
  { key: "paperTitle", label: "Original Paper", isLink: true, href: "pdf" },
  { key: "year", label: "Year" },
  { key: "type", label: "Type" },
  { key: "primaryUseCase", label: "Use Case" },
  { key: "flowchart", label: "Flowchart", isImage: true },
  { key: "highLevelIntuition", label: "High Level Intuition" },
  { key: "bestPerformance", label: "Best Performance" },
  { key: "pros", label: "Pros", isList: true },
  { key: "cons", label: "Cons", isList: true },
  { key: "analogy", label: "ELI5 Analogy" },
  { key: "openSource", label: "Open Source Code", isLink: true }
];


// Info Card Table
function ModelTable({ details, setEnlargedFlowchart }) {
  return (
    <table
      className="node-table"
      style={{
        tableLayout: "fixed",
        width: "100%",
        borderCollapse: "separate",
        borderSpacing: 0,
        background: "#fff",
        borderRadius: 8,
        border: "1.2px solid #e5e7eb",
        overflow: "hidden"
      }}
    >
      <tbody>
        {FIELD_CONFIG.map((field) => (
          <tr key={field.key}>
            <td style={{
              width: 70,
              background: "#f3f4f6",
              textAlign: "right",
              fontWeight: 500,
              color: "#33394b",
              fontSize: 11,
              borderRight: "1px solid #e5e7eb",
              padding: "6px 6px 6px 2px",
              verticalAlign: "top"
            }}>
              {field.label}
            </td>
            <td style={{
              fontSize: 12.5,
              color: "#24272c",
              padding: "6px 7px 6px 11px",
              verticalAlign: "top"
            }}>
              {field.key === "paperTitle" && details.pdf ? (
                <a
                  href={details.pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#2563eb", textDecoration: "underline", fontSize: 12.5 }}
                >
                  pdf
                </a>
              ) : field.isImage && details[field.key] ? (
                setEnlargedFlowchart ? (
                  <span
                    style={{ cursor: "zoom-in", display: "inline-block" }}
                    onClick={() => setEnlargedFlowchart(details[field.key])}
                    tabIndex={0}
                    title="Click to enlarge"
                  >
                    <img
                      src={details[field.key]}
                      alt={field.label}
                      style={{ maxWidth: 180, maxHeight: 90, borderRadius: 5 }}
                    />
                  </span>
                ) : (
                  <img
                    src={details[field.key]}
                    alt={field.label}
                    style={{ maxWidth: 180, maxHeight: 90, borderRadius: 5 }}
                  />
                )
              ) : field.isLink && details[field.key] ? (
                <a
                  href={details[field.href || field.key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#2563eb", textDecoration: "underline", fontSize: 12.5 }}
                >
                  {details[field.key]}
                </a>
              ) : field.isList && Array.isArray(details[field.key]) ? (
                <ul style={{ paddingLeft: 18, margin: 0, fontSize: 12 }}>
                  {details[field.key].map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              ) : (
                <span style={{ fontSize: 12.5 }}>{details[field.key] || ""}</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EnlargedImageModal({ src, onClose }) {
  if (!src) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, width: "100vw", height: "100vh",
        background: "rgba(0,0,0,0.56)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 200010,
      }}
      onClick={onClose}
    >
      <img
        src={src}
        alt="Enlarged flowchart"
        style={{
          maxWidth: "92vw", maxHeight: "82vh",
          borderRadius: 12,
          background: "#fff",
          boxShadow: "0 8px 48px #0008",
          border: "2px solid #e0e0e0",
          cursor: "zoom-out",
        }}
        onClick={e => e.stopPropagation()} // Only click on background closes
      />
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 34, right: 54,
          background: "#ef4444",
          color: "#fff",
          border: "none",
          borderRadius: "50%",
          width: 36, height: 36,
          fontSize: 23, fontWeight: 700, cursor: "pointer", zIndex: 100001,
          boxShadow: "0 2px 8px #0003", display: "flex",
          alignItems: "center", justifyContent: "center", lineHeight: 1
        }}
        aria-label="Close enlarged flowchart"
        tabIndex={0}
      >&times;</button>
    </div>
  );
}


// Info Popup (single)
// Assuming ModelTable and EnlargedImageModal are in the same file or imported above

function InfoPopup({ model, onClose }) {
  const [enlargedFlowchart, setEnlargedFlowchart] = useState(null);

  // Close enlarged image with Escape key
  React.useEffect(() => {
    if (!enlargedFlowchart) return;
    function handleEsc(e) {
      if (e.key === "Escape") setEnlargedFlowchart(null);
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [enlargedFlowchart]);

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0, left: 0, width: "100vw", height: "100vh",
          background: "rgba(0,0,0,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 10001,
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: "#fff",
            padding: 20,
            borderRadius: 8,
            minWidth: 320,
            maxWidth: 350,
            maxHeight: "80vh",
            overflowY: "auto",
            border: "1.5px solid #ddd",
            position: "relative"
          }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: "50%",
              width: 25,
              height: 25,
              fontSize: 20,
              fontWeight: 700,
              cursor: "pointer",
              zIndex: 10100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              lineHeight: 1
            }}
            aria-label="Close"
          >&times;</button>
          <h4 style={{ textAlign: "center", marginBottom: 10 }}>
            {model.model}
          </h4>
          <ModelTable details={model} setEnlargedFlowchart={setEnlargedFlowchart} />
        </div>
      </div>
      <EnlargedImageModal src={enlargedFlowchart} onClose={() => setEnlargedFlowchart(null)} />
    </>
  );
}


// Comparison Modal
// Comparison Modal
function CompareModal({ nodes, onClose }) {
  // If no nodes, render nothing
  if (!nodes || !nodes.length) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          padding: "28px 44px",
          borderRadius: 14,
          maxHeight: "86vh",
          maxWidth: 900,         // <= never fills screen horizontally, even on large monitor
          width: "90vw",
          minWidth: 380,
          marginLeft: "auto",
          marginRight: "auto",
          boxShadow: "0 8px 40px 0 #0003",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          overflow: "hidden"
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: "#ef4444",
            color: "#fff",
            border: "none",
            borderRadius: "50%",
            width: 25,
            height: 25,
            fontSize: 20,
            fontWeight: 700,
            cursor: "pointer",
            zIndex: 10100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            lineHeight: 1
          }}
          aria-label="Close"
        >&times;</button>
        <div
          style={{
            width: "100%",
            maxHeight: "66vh",
            overflowX: "auto",
            overflowY: "auto"
          }}
        >
          <table
            style={{
              borderCollapse: "separate",
              borderSpacing: 0,
              minWidth: 340,
              background: "#fff",
              borderRadius: 9,
              border: "0.5px solid #64748b",
              overflow: "hidden"
            }}
          >
            <thead>
              <tr>
                <th style={{
                  background: "#f3f4f6",
                  color: "#33394b",
                  fontWeight: 600,
                  fontSize: 13,
                  minWidth: 70,
                  padding: "8px 7px",
                  border: "0.5px solid #64748b"
                }}></th> {/* Empty label */}
                {nodes.map((m, idx) => (
                  <th
                    key={m.id}
                    style={{
                      background: "#f8fafc",
                      color: "#262d38",
                      fontWeight: 700,
                      fontSize: 14,
                      minWidth: 128,
                      padding: "8px 9px",
                      border: "0.5px solid #64748b"
                    }}
                  >
                    {m.model}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FIELD_CONFIG.map((field) => (
                <tr key={field.key}>
                  <td style={{
                    background: "#f3f4f6",
                    color: "#33394b",
                    fontWeight: 500,
                    fontSize: 11,
                    textAlign: "right",
                    padding: "7px 6px 7px 2px",
                    verticalAlign: "top",
                    border: "0.5px solid #64748b"
                  }}>
                    {field.label}
                  </td>
                  {nodes.map((model) => (
                    <td
                      key={model.id + field.key}
                      style={{
                        fontSize: 12.5,
                        color: "#24272c",
                        padding: "7px 8px",
                        verticalAlign: "top",
                        minWidth: 128,
                        background: "#fff",
                        border: "0.5px solid #64748b"
                      }}
                    >
                      {/* Paper row: just "pdf" link */}
                      {field.key === "paperTitle" && model.pdf ? (
                        <a
                          href={model.pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#2563eb", textDecoration: "underline", fontSize: 12.5 }}
                        >
                          pdf
                        </a>
                      ) : field.isImage && model[field.key] ? (
                        <img src={model[field.key]} alt={field.label} style={{ maxWidth: 140, maxHeight: 70 }} />
                      ) : field.isLink && model[field.key] ? (
                        <a
                          href={model[field.href || field.key]}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#2563eb", textDecoration: "underline", fontSize: 12.5 }}
                        >
                          {model[field.key]}
                        </a>
                      ) : field.isList && Array.isArray(model[field.key]) ? (
                        <ul style={{ paddingLeft: 14, margin: 0, fontSize: 12 }}>
                          {model[field.key].map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <span style={{ fontSize: 12.5 }}>{model[field.key] || ""}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


// Build: useCaseSortedNodes[useCase] = [sorted list of models]
const useCaseSortedNodes = {};
for (const uc of USE_CASES) {
  // Only nodes in this strip, sorted ascending by citations (fallback 0)
  const sorted = models
    .filter(m => m.primaryUseCase === uc)
    .sort((a, b) => (Number(a.citations) || 0) - (Number(b.citations) || 0));
  useCaseSortedNodes[uc] = sorted;
}


function InfoHowToUseModal({ onClose }) {
  const content = [
    {
      purpose: "Explore foundational generative models",
      functionality: "Timeline visualization by year & use-case. Click nodes to see details. Compare models side-by-side.",
      shortcut: <><kbd style={kbd}>c</kbd> Toggle Compare<br/><kbd style={kbd}>r</kbd> Reset<br/><kbd style={kbd}>/</kbd> Focus search<br/><kbd style={kbd}>Esc</kbd> Close popups<br/>Mouse/drag: Scroll timeline</>
    },
    {
      purpose: "Find & learn about models quickly",
      functionality: "Sidebar search and table, highlight selection, view best performances, filter and jump to models.",
      shortcut: <><kbd style={kbd}>↑</kbd>/<kbd style={kbd}>↓</kbd> Navigate search<br/><kbd style={kbd}>Enter</kbd> Select search result<br/>Mouse Wheel: Scroll timeline horizontally</>
    },
    {
      purpose: "Reference for research & teaching",
      functionality: "Access paper links, pros/cons, flowcharts, and analogies for each model.",
      shortcut: ""
    }
  ];

  useEffect(() => {
    const esc = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, width: "100vw", height: "100vh",
        background: "rgba(0,0,0,0.28)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 20000
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 15,
          minWidth: 390,
          maxWidth: 720,
          width: "94vw",
          maxHeight: "83vh",
          margin: 28,
          padding: "34px 28px 18px 28px",
          boxShadow: "0 12px 48px #0002",
          position: "relative",
          overflowY: "auto",
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 12, right: 12,
            background: "#ef4444",
            color: "#fff",
            border: "none",
            borderRadius: "50%",
            width: 26,
            height: 26,
            fontSize: 19,
            fontWeight: 700,
            cursor: "pointer",
            zIndex: 20100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            lineHeight: 1
          }}
          aria-label="Close"
        >&times;</button>
        <h3 style={{margin: 0, marginBottom: 16, textAlign: "center", fontWeight: 700, fontSize: "1.13rem"}}>
          Why / How to Use this Page?
        </h3>
        <table style={{
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: 0,
  background: "#fff",
  borderRadius: 8,
  border: "1.2px solid #e5e7eb",
  fontSize: 14,
  margin: "0 auto"
}}>
  <thead>
    <tr>
      <th style={th}>Purpose</th>
      <th style={th}>Main Functionalities</th>
      <th style={th}>Keyboard / Mouse Shortcuts</th>
    </tr>
  </thead>
  <tbody>
    <tr>
  <td style={{ ...td, width: "33%" }}>
    <ul style={{paddingLeft: 18, margin: 0}}>
      <li style={{marginBottom: 10}}>
        To ignite curiosity for understanding foundational deep generative models through comparison; as "comparison" is perhaps the root of all scientific curiosity.
      </li>
      <li style={{marginBottom: 10}}>
        To visualize all the foundational models together, and understand voids & limitations of existing research.
      </li>
      <li style={{marginBottom: 10}}>
        To make this visualization-through-comparison-technique more accessible to a wide global audience, keeping it free of cost and making it user friendly.
      </li>
      <li style={{marginBottom: 10}}>
        Inspired by Stanford Online XCS236: Deep Generative Models course where the author learnt more about why such models work for the very first time.
      </li>
    </ul>
  </td>
  <td style={{ ...td, width: "34%" }}>
    <ul style={{paddingLeft: 18, margin: 0}}>
      <li style={{marginBottom: 10}}>
        Selection of any model can be either done by clicking its node on the chart, or its row in the right table.
      </li>
      <li style={{marginBottom: 10}}>
        In comparison mode, you can select multiple models, and press the "Compare" button to visualize their info side by side. The column order is fixed by publication year.
      </li>
      <li style={{marginBottom: 10}}>
        Hovering over a node (in chart) provides you quick info about that model, mainly its name and advantages.
      </li>
      <li style={{marginBottom: 10}}>
        For info of a single model, you can directly select the node without entering into comparison mode.
      </li>
      <li style={{marginBottom: 10}}>
        Feel free to drop a suggestion or feedback anytime!
      </li>
    </ul>
  </td>
  <td style={{ ...td, width: "33%" }}>
    <ul style={{paddingLeft: 18, margin: 0, listStyleType: "disc"}}>
      <li style={{marginBottom: 10}}><kbd style={kbd}>c</kbd> Toggle Compare</li>
      <li style={{marginBottom: 10}}><kbd style={kbd}>r</kbd> Reset</li>
      <li style={{marginBottom: 10}}><kbd style={kbd}>/</kbd> Focus search</li>
      <li style={{marginBottom: 10}}><kbd style={kbd}>Esc</kbd> Close popups</li>
      <li style={{marginBottom: 10}}><kbd style={kbd}>↑</kbd>/<kbd style={kbd}>↓</kbd> Navigate search</li>
      <li style={{marginBottom: 10}}><kbd style={kbd}>Enter</kbd> Select search result</li>
      <li style={{marginBottom: 0}}><span>Mouse Wheel / drag: Scroll timeline</span></li>
    </ul>
  </td>
</tr>

  </tbody>
</table>

      </div>
    </div>
  );
}
const th = { background: "#f8fafc", fontWeight: 700, padding: "7px 10px", border: "1px solid #e5e7eb", fontSize: 13 };
const td = { background: "#fff", fontWeight: 400, padding: "7px 10px", border: "1px solid #e5e7eb", verticalAlign: "top", fontSize: 13, textAlign: "left" };
const kbd = { background: "#f1f5f9", padding: "2px 7px", borderRadius: 4, fontSize: "0.96em", border: "1px solid #e5e7eb", margin: "0 2px", fontFamily: "inherit" };

const MODEL_TYPE_LEGEND = [
  { abbr: "AR",   color: "#ff6b00" },
  { abbr: "GAN",  color: "#22c55e" },
  { abbr: "Flow", color: "#0ea5e9" },
  { abbr: "EBM",  color: "#FFA500" },
  { abbr: "VAE",  color: "#facc15" },
  { abbr: "Diff", color: "#f43f5e" },
];

function ModelTypeLegend({ style = {} }) {
  return (
    <div
      style={{
        position: "fixed",           // <--- FIXED instead of absolute!
        left: 110,                    // Distance from window left edge
        top: 191,                     // Distance from window top edge
        zIndex: 2022,                // Above most content, below modals
        background: "rgba(255,255,255,0.67)",
        border: "1px solid #e5e7eb",
        borderRadius: 7,
        // boxShadow: "0 2px 8px #0001",
        padding: "4px 9px",
        minWidth: 0,
        fontFamily: "Inter, sans-serif",
        fontSize: "8.5px",
        color: "#23272b",
        display: "flex",
        flexDirection: "column",
        gap: 5,
        pointerEvents: "none",
        ...style,
      }}
    >
      {MODEL_TYPE_LEGEND.map((type) => (
        <div
          key={type.abbr}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            minWidth: 0,
            fontSize: "8.5px",
            fontWeight: 600,
            letterSpacing: "0.01em"
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              background: type.color,
              borderRadius: 2.5,
              marginRight: 2,
              border: "1px solid #cbd5e1",
              boxSizing: "border-box"
            }}
          />
          <span>{type.abbr}</span>
        </div>
      ))}
    </div>
  );
}


// Main FlowChart
export default function FlowChart() {
  const boardScroller = useRef();
  const [openNode, setOpenNode] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showComparison, setShowComparison] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [showInfo, setShowInfo] = useState(false);


  // vertical math
  const stripHeight = (BOARD_HEIGHT - TIMELINE_HEIGHT) / USE_CASES.length;

  // Create citation stats per use case strip
  const useCaseStats = {};
  for (const uc of USE_CASES) {
    const modelsInStrip = models.filter(m => m.primaryUseCase === uc);
    const citations = modelsInStrip.map(m => Number(m.citations) || 0); // Fallback to 0 if missing
    const l_cit = Math.min(...citations);
    const h_cit = Math.max(...citations);
    useCaseStats[uc] = { l_cit, h_cit, modelsInStrip };
  }

  function getNodeY(m) {
    const stripIdx = USE_CASES.indexOf(m.primaryUseCase);
    if (stripIdx === -1) return 0;

    const sorted = useCaseSortedNodes[m.primaryUseCase] || [];
    const N = sorted.length;
    if (N === 0) return stripIdx * stripHeight + stripHeight / 2 - NODE_HEIGHT / 2;

    // Y-range: from 5% above bottom to 5% below top
    const y_min = stripIdx * stripHeight + 0.05 * stripHeight;
    const y_max = (stripIdx + 1) * stripHeight - 0.05 * stripHeight - NODE_HEIGHT;

    // Where is 'm' in the sorted order?
    const idx = sorted.findIndex(n => n.id === m.id);
    if (N === 1 || idx === -1) {
      // Only one node: center
      return stripIdx * stripHeight + stripHeight / 2 - NODE_HEIGHT / 2;
    }

    // Equal vertical spacing
    if (N === 2) {
      // Only two nodes: top and bottom
      return idx === 0 ? y_min : y_max;
    }
    // For N > 2:
    // idx=0 -> y_max, idx=N-1 -> y_min (higher citations at top, as before)
    return y_max - (y_max - y_min) * (idx / (N - 1));
  }

  // Node X: use label width as left offset
  function getNodeX(m) {
    return LABEL_COL_WIDTH + dateToX(
      m.exactDate || `${m.year}-07-01`,
      minDate,
      maxDate,
      timelineWidth
    ) - NODE_HEIGHT / 2;
  }

  const scrollToModelById = (id) => {
    const m = models.find(x => x.id === id);
    if (!m || !boardScroller.current) return;
    const nodeX = getNodeX(m); // position of node
    const nodeWidth = NODE_HEIGHT;
    const container = boardScroller.current;
    const containerWidth = container.offsetWidth;
    const scrollTo = Math.max(
      0,
      nodeX + nodeWidth / 2 - containerWidth / 2
    );
    container.scrollTo({
      left: scrollTo,
      behavior: "smooth"
    });
  };

  // Node click logic
  const handleNodeClick = (m, event) => {
    event.stopPropagation();
    if (compareMode) {
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(m.id)) newSet.delete(m.id);
        else newSet.add(m.id);
        return newSet;
      });
    } else {
      setOpenNode(m);
    }
  };

  const resetView = () => {
    setCompareMode(false);
    setSelectedIds(new Set());
    setOpenNode(null);
    setShowComparison(false);
  };

  const handleCompare = () => setShowComparison(true);

  // Prevent page scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
  const handleKeyDown = (e) => {
    // Don't trigger if a text input is focused
    const tag = document.activeElement.tagName.toLowerCase();
    if (tag === "input" || tag === "textarea") return;

    if (e.key === "c" || e.key === "C") {
      setCompareMode(m => !m);
      setSelectedIds(new Set());
      setOpenNode(null);
      setShowComparison(false);
    }
    if (e.key === "r" || e.key === "R") {
      resetView();
    }
    if (e.key === "/") {
      // Focus search bar: add an id to your search input like id="search-bar"
      const sb = document.getElementById("search-bar");
      if (sb) { sb.focus(); e.preventDefault(); }
    }
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, []);

useEffect(() => {
  const scroller = boardScroller.current;
  if (!scroller) return;

  function onWheel(e) {
    // Only scroll horizontally if shift is NOT held (let shift+wheel do default)
    if (e.deltaY !== 0 && !e.shiftKey) {
      // Prevent normal vertical scroll
      e.preventDefault();
      // Scroll right on wheel UP, left on wheel DOWN (reverse direction if you want)
      scroller.scrollLeft += e.deltaY;  // positive: scroll right, negative: scroll left
    }
  }

  scroller.addEventListener("wheel", onWheel, { passive: false });
  return () => scroller.removeEventListener("wheel", onWheel);
}, []);


  // Grab-to-scroll functionality
  useEffect(() => {
    const scroller = boardScroller.current;
    if (!scroller) return;
    let isDown = false, startX, scrollLeft;
    const onDown = e => {
      isDown = true;
      startX = e.pageX - scroller.offsetLeft;
      scrollLeft = scroller.scrollLeft;
      scroller.style.cursor = "grabbing";
    };
    const onUp = () => { isDown = false; scroller.style.cursor = "grab"; };
    const onMove = e => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - scroller.offsetLeft;
      const walk = (x - startX);
      scroller.scrollLeft = scrollLeft - walk;
    };
    scroller.addEventListener("mousedown", onDown);
    scroller.addEventListener("mouseleave", onUp);
    scroller.addEventListener("mouseup", onUp);
    scroller.addEventListener("mousemove", onMove);
    scroller.style.cursor = "grab";
    return () => {
      scroller.removeEventListener("mousedown", onDown);
      scroller.removeEventListener("mouseleave", onUp);
      scroller.removeEventListener("mouseup", onUp);
      scroller.removeEventListener("mousemove", onMove);
      scroller.style.cursor = "";
    };
  }, []);

  // Render frozen label column (absolutely overlays the scroll area)
  function renderFrozenStripLabels() {
    return (
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: LABEL_COL_WIDTH,
          height: BOARD_HEIGHT - TIMELINE_HEIGHT,
          zIndex: 10,
          pointerEvents: "none",
          background: "transparent"
        }}
      >
        {USE_CASES.map((uc, i) => (
          <div
            key={uc}
            style={{
              position: "absolute",
              left: 0,
              top: i * stripHeight,
              width: LABEL_COL_WIDTH - 2,
              height: stripHeight,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              paddingTop: 8,
              fontFamily: "Inter",
              userSelect: "none",
              background: i % 2 ? "#f8fafc" : "#f1f5f9",
              borderRight: "1.5px solid #e5e7eb"
            }}
          >
            <span style={{ fontSize: 28, marginBottom: 0 }}>{EMOJIS[uc]}</span>
            <span style={{
              fontSize: 11,
              color: "#34373c",
              fontWeight: 500,
              marginTop: 1,
              letterSpacing: "0.01em"
            }}>
              {uc}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
  <>
    <h1
  style={{
    marginLeft: LABEL_COL_WIDTH,
    marginTop: 30,
    marginBottom: 10,
    fontFamily: "Inter, sans-serif",
    fontSize: "2.5rem",
    fontWeight: 700,
    color: "#0f172a"
  }}
>
  Foundational Generative Models
</h1>
<div
  style={{
    marginLeft: LABEL_COL_WIDTH,   // <-- Change is here
    fontSize: "0.8rem",
    color: "#64748b",
    marginBottom: 32,
    fontWeight: 400,
    display: "flex",
    alignItems: "center",
    gap: 18
  }}
>
  <span>
    Date: Aug 1, 2025 &nbsp; | &nbsp;Author:{" "}
    <a
      href="https://github.com/Amiton7"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: "#64748b",
        textDecoration: "none",
        fontWeight: 400,
        fontSize: "0.8rem",
      }}
      tabIndex={0}
      title="View GitHub profile"
    >
      Amit Bendkhale
    </a> 
    &nbsp; | &nbsp; AI Tools used: ChatGPT 4.1, Perplexity AI
  </span>
  <button
    style={{
      marginLeft: 10,
      background: "#e0e7ff",
      color: "#262d38",
      border: "1px solid #a5b4fc",
      borderRadius: 7,
      fontWeight: 600,
      fontSize: 13.5,
      padding: "4px 13px",
      cursor: "pointer",
      boxShadow: "none"
    }}
    onClick={() => setShowInfo(true)}
    tabIndex={0}
    title="Learn why and how to use this timeline"
  >
    Why / How to Use?
  </button>
</div>


    {/* Control bar */}
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        margin: `6px ${LABEL_COL_WIDTH - 25}px 8px ${LABEL_COL_WIDTH}px`
      }}
    >
      <button
        onClick={() => {
          setCompareMode((m) => !m);
          setSelectedIds(new Set());
          setOpenNode(null);
          setShowComparison(false);
        }}
        style={{
          background: compareMode ? "#0ea5e9" : "#fff",
          color: compareMode ? "#fff" : "#0f172a",
          border: "1px solid #0ea5e9",
          borderRadius: 6,
          fontSize: 15,
          fontWeight: 600,
          padding: "5px 18px 5px 15px",
          minWidth: 104,
          letterSpacing: "0.02em"
        }}
      >
        {compareMode ? "Comparison Mode" : "Comparison Mode"}
      </button>
      <button
        onClick={resetView}
        style={{
          background: "#fff",
          color: "red",
          border: "1px solid red",
          borderRadius: 5,
          fontSize: 12,
          padding: "4px 10px",
          minWidth: 52,
          fontWeight: 500,
          letterSpacing: "0.01em"
        }}
      >
        Reset
      </button>
    </div>

    {/* ========== Main chart area with sidebar (ALL IN ONE FLEX ROW) ========== */}
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch", // <--- Ensures top/bottom alignment!
        width: "100%",
        maxWidth: "100vw",
        position: "relative",
        marginBottom: 0,
        marginLeft: 0,
        paddingBottom: 5,
      }}
    >
      {/* Frozen labels */}
      <div
        style={{
          position: "relative",
          minWidth: LABEL_COL_WIDTH,
          width: LABEL_COL_WIDTH,
          height: BOARD_HEIGHT - TIMELINE_HEIGHT,
          zIndex: 20,
          background: "transparent"
        }}
      >
        {renderFrozenStripLabels()}
      </div>
      {/* Scrollable board/chart */}
      <div
        ref={boardScroller}
        className="timeline-scrollbar"
        style={{
          border: "none",
          borderRadius: 0,
          backgroundColor: "transparent",
          position: "relative",
          overflowX: "auto",
          overflowY: "hidden",
          width: `calc(100vw - ${LABEL_COL_WIDTH + (minimized ? 24 : 240)}px)`, // Shrink for sidebar!
          minWidth: 0,
          // minHeight: BOARD_HEIGHT + TIMELINE_HEIGHT,
          height: BOARD_HEIGHT + TIMELINE_HEIGHT,
          whiteSpace: "nowrap",
          userSelect: "none",
          scrollbarColor: "#a3a3a3 #e5e7eb",
          scrollbarWidth: "thin",
          boxSizing: "border-box"
        }}
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === "ArrowLeft") boardScroller.current.scrollLeft -= 60;
          if (e.key === "ArrowRight") boardScroller.current.scrollLeft += 60;
        }}
      >
        <div
          style={{
            position: "relative",
            width: timelineWidth,
            minHeight: BOARD_HEIGHT + TIMELINE_HEIGHT,
            height: BOARD_HEIGHT + TIMELINE_HEIGHT
          }}
        >
          {/* Usecase strips as SVG background */}
          <UseCaseStrips
            useCases={USE_CASES}
            minYear={minDate.getFullYear()}
            maxYear={maxDate.getFullYear()}
            whiteboardWidth={timelineWidth}
            whiteboardHeight={BOARD_HEIGHT - TIMELINE_HEIGHT}
            labelOffset={LABEL_COL_WIDTH}
          />
          {/* Nodes */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: timelineWidth,
              height: BOARD_HEIGHT - TIMELINE_HEIGHT,
              zIndex: 7
            }}
          >
            {models.map(m => {
              // Build hover text
              let hoverText = m.model || "";
              const pros = (m.pros || []).slice(0, 3).filter(Boolean);
              if (pros.length) {
                hoverText += "\nPros:";
                pros.forEach(p => { hoverText += `\n- ${p}`; });
              }
              const borderColor = compareMode
                ? (selectedIds.has(m.id)
                    ? "3.5px solid #334155"
                    : "1.1px solid #475569")
                : "1.1px solid #475569";

              return (
                <div
                  key={m.id}
                  style={{
                    position: "absolute",
                    left: getNodeX(m),
                    top: getNodeY(m),
                    width: NODE_HEIGHT,
                    height: NODE_HEIGHT,
                    borderRadius: 5,
                    background: m.color,
                    border: borderColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 400,
                    fontSize: 6,
                    color: "#22272a",
                    cursor: "pointer",
                    userSelect: "none",
                    zIndex: 10
                  }}
                  title={hoverText}
                  onClick={e => handleNodeClick(m, e)}
                >
                  <div
                    style={{
                      textAlign: "center",
                      maxWidth: NODE_HEIGHT - 2,
                      maxHeight: NODE_HEIGHT - 2,
                      overflow: "hidden",
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                      whiteSpace: "pre-line",
                      fontWeight: 700,
                      fontSize: 6,
                      lineHeight: 1.1,
                      padding: 0
                    }}
                  >
                    {(m.id || "").slice(0, 8)}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Timeline axis */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: BOARD_HEIGHT - TIMELINE_HEIGHT,
              width: timelineWidth,
              height: TIMELINE_HEIGHT,
              background: "#e5e7eb",
              zIndex: 25,
              display: "flex",
              alignItems: "flex-end",
              pointerEvents: "none"
            }}
          >
            <TimelineAxis
              minYear={minDate.getFullYear()}
              maxYear={maxDate.getFullYear()}
              flowTransform={{ x: 0, y: 0, zoom: 1 }}
              whiteboardWidth={timelineWidth}
              height={TIMELINE_HEIGHT}
              labelOffset={LABEL_COL_WIDTH}
            />
          </div>

          {/* === Dropdowns ABOVE compare button === */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 10,
              alignItems: "center",
              marginLeft: 18,
              marginBottom: 4
            }}
          >
            <select style={{
              fontSize: 12,
              padding: "2.5px 6px",
              borderRadius: 5,
              border: "1px solid #d1d5db",
              background: "#f3f4f6",
              color: "#22223b",
              minWidth: 70,
              height: 22
            }}>
              <option>Purpose</option>
              <option>Compare models</option>
              <option>Research reference</option>
            </select>
            <select style={{
              fontSize: 12,
              padding: "2.5px 6px",
              borderRadius: 5,
              border: "1px solid #d1d5db",
              background: "#f3f4f6",
              color: "#22223b",
              minWidth: 90,
              height: 22
            }}>
              <option>How to Use</option>
              <option>Click nodes/rows</option>
              <option>Use Compare for side-by-side</option>
            </select>
          </div>
        </div>
        {/* Compare button -- move here */}
          {compareMode && selectedIds.size >= 2 && !showComparison && (
            <div
              style={{
                width: `calc(100vw - ${LABEL_COL_WIDTH + (minimized ? 24 : 320)}px)`,
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "center",
                position: "absolute",
                left: LABEL_COL_WIDTH,
                top: BOARD_HEIGHT + 3, // just below timeline
                zIndex: 40,
                background: "transparent",
                pointerEvents: "auto"
              }}
            >
              <button
                className="compare-btn"
                style={{
                  background: "#0ea5e9",
                  color: "#fff",
                  border: "1px solid #0ea5e9",
                  borderRadius: 6,
                  padding: "6px 15px",
                  fontSize: 15,
                  marginBottom: 0,
                  minWidth: 90,
                  boxShadow: "none"
                }}
                onClick={handleCompare}
              >
                Compare ({selectedIds.size})
              </button>
            </div>
          )}
          
      </div>
      {/* PLACE THE LEGEND COMPONENT HERE: */}
      <ModelTypeLegend />
      {/* --- Toggle Button, absolutely positioned --- */}
      <button
        style={{
          position: "absolute",
          right: minimized ? 0 : 227, // or your sidebar width, so it stays between chart and sidebar!
          top: "50%",
          transform: "translateY(-50%)",
          background: "#636363",
          border: "none",
          borderRadius: 7,
          width: 25,
          height: 25,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          color: "#f1f5f9",
          fontWeight: 700,
          fontSize: 22,
          cursor: "pointer",
          zIndex: 400,
          boxShadow: "none"
        }}
        onClick={() => setMinimized(!minimized)}
        title={minimized ? "Show model list" : "Hide model list"}
      >
        {minimized ? "«" : "»"}
      </button>

      

      {/* ========== SIDEBAR is here and inline! ========== */}
      <ModelListSidebar
        models={models}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        compareMode={compareMode}
        minimized={minimized}
        setMinimized={setMinimized}
        onScrollToModel={scrollToModelById}
        boardHeight={BOARD_HEIGHT}
        timelineHeight={TIMELINE_HEIGHT}
        setOpenNode={setOpenNode}
        style={{
          height: BOARD_HEIGHT + TIMELINE_HEIGHT,
          minHeight: BOARD_HEIGHT + TIMELINE_HEIGHT,
          maxHeight: BOARD_HEIGHT + TIMELINE_HEIGHT,
          marginLeft: 0, // Remove default margin
        }}
      />
      {/* Spacer to ensure footer is visible */}
      <div style={{ height: 56 }} />
    </div>
    {/* Modals */}
    {showComparison && (
      <CompareModal nodes={models.filter(m => selectedIds.has(m.id))} onClose={() => setShowComparison(false)} />
    )}
    {showInfo && <InfoHowToUseModal onClose={() => setShowInfo(false)} />}
    {openNode && !compareMode && (
      <InfoPopup
        model={openNode}
        onClose={() => {
          setOpenNode(null);
          setSelectedIds(new Set()); // Deselect row when closing popup
        }}
      />
    )}
  </>
);
}