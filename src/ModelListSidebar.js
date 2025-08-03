// ModelListSidebar.js
import React, { useState } from "react";

// Default search bar height (you can adjust)
const SEARCH_BAR_HEIGHT = 48;

export default function ModelListSidebar({
  models,
  selectedIds,
  setSelectedIds,
  compareMode,
  minimized,
  setMinimized,
  onScrollToModel,
  setOpenNode,
  style = {},
  boardHeight,
  timelineHeight,
}) {
  // Sidebar height math
  const sidebarHeight = boardHeight && timelineHeight
    ? boardHeight + timelineHeight
    : undefined;

  // --- SEARCH LOGIC (with keyboard navigation) ---
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedResultIdx, setSelectedResultIdx] = useState(-1);

  function handleSearchChange(e) {
    setSearch(e.target.value);
    const filtered = models.filter(m =>
      (m.model || "").toLowerCase().includes(e.target.value.toLowerCase())
      || (m.id || "").toLowerCase().includes(e.target.value.toLowerCase())
    );
    setSearchResults(filtered);
    setSelectedResultIdx(filtered.length ? 0 : -1);
  }

  function handleSearchKeyDown(e) {
    if (!searchResults.length) return;
    if (e.key === "ArrowDown") {
      setSelectedResultIdx(idx => Math.min(idx + 1, searchResults.length - 1));
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setSelectedResultIdx(idx => Math.max(idx - 1, 0));
      e.preventDefault();
    } else if (e.key === "Enter" && selectedResultIdx !== -1) {
      const selectedModel = searchResults[selectedResultIdx];
      if (compareMode) {
        setSelectedIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(selectedModel.id)) newSet.delete(selectedModel.id);
          else newSet.add(selectedModel.id);
          return newSet;
        });
      } else {
        setOpenNode(selectedModel);
      }
      onScrollToModel?.(selectedModel.id);
      // Optional: clear search after selection
      // setSearch(""); setSearchResults([]);
    }
  }

  // Standard table fallback if not searching
  const filtered = models
    .filter(m =>
      (m.model || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.id || "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => (a.id || "").localeCompare(b.id || ""));


  const handleRowClick = (m) => {
    if (compareMode) {
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(m.id)) newSet.delete(m.id); else newSet.add(m.id);
        return newSet;
      });
      onScrollToModel?.(m.id);
    } else {
      setSelectedIds(new Set([m.id]));
      onScrollToModel?.(m.id);
      setOpenNode?.(m);
    }
  };

  const handleRadioChange = (id) => setSelectedIds(new Set([id]));

  function formatMonthYear(dateString, fallbackYear) {
    if (!dateString) return fallbackYear || "";
    const d = new Date(dateString);
    if (isNaN(d)) return fallbackYear || "";
    const month = d.toLocaleString("en-US", { month: "short" });
    const year = d.getFullYear();
    return `${month} ${year}`;
  }

  // --- Minimized view ---
  if (minimized) {
    return (
      <div
        style={{
          width: 28,
          minWidth: 28,
          height: sidebarHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          borderLeft: "1.5px solid #e5e7eb",
          background: "#f8fafc",
          ...style,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: 240,
        minWidth: 170,
        maxWidth: 320,
        height: sidebarHeight,
        borderLeft: "1.5px solid #e5e7eb",
        background: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        position: "relative",
        ...style,
      }}
    >
      {/* Search bar with dropdown */}
      <div style={{
        height: SEARCH_BAR_HEIGHT,
        background: "#f3f4f6",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        padding: 0,
        margin: 0,
        position: "relative"
      }}>
        <input
          id="search-bar"   // <<=== ADD THIS LINE!
          value={search}
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search model…"
          style={{
            width: "94%",
            padding: "8px 12px",
            border: "1.1px solid #e5e7eb",
            borderRadius: 0,
            background: "#fff",
            fontSize: 14,
            height: 30,
            margin: 0,
            outline: "none",
          }}
        />
        {/* SEARCH DROPDOWN (shows only if typing) */}
        {search.length > 0 && (
          <ul style={{
            maxHeight: 168,
            overflowY: "auto",
            margin: 0,
            padding: 0,
            position: "absolute",
            left: 0,
            top: SEARCH_BAR_HEIGHT,
            width: "100%",
            background: "#fff",
            border: "1px solid #e5e7eb",
            zIndex: 300,
            borderRadius: "0 0 7px 7px",
            boxShadow: "0 6px 24px #0002",
            listStyle: "none",
          }}>
            {searchResults.length === 0 ? (
              <li style={{ padding: 7, color: "#888" }}>No results</li>
            ) : (
              searchResults.map((m, i) => (
                <li
                  key={m.id}
                  style={{
                    background: i === selectedResultIdx ? "#e0e7ff" : "transparent",
                    fontWeight: i === selectedResultIdx ? 700 : 400,
                    padding: "6px 14px",
                    cursor: "pointer",
                    fontSize: 14,
                    color: "#22223b"
                  }}
                  onMouseEnter={() => setSelectedResultIdx(i)}
                  onClick={() => {
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
                    onScrollToModel?.(m.id);
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{m.id}</span>
                  {/* Optionally, show model name faintly */}
                  <span style={{ color: "#64748b", fontWeight: 400, marginLeft: 7 }}>
                    {m.model !== m.id ? m.model : ""}
                  </span>
                </li>

              ))
            )}
          </ul>
        )}
      </div>

      {/* Table: fills to bottom, aligns with chart and timeline */}
      <div style={{
        height: `calc(100% - ${SEARCH_BAR_HEIGHT}px)`,
        overflowY: "auto",
        width: "100%",
        padding: 0,
        margin: 0,
        boxSizing: "border-box"
      }}>
        <table style={{
          width: "100%",
          borderCollapse: "separate",
          borderSpacing: 0,
          background: "#fff",
          border: "1.2px solid #e5e7eb",
          borderRadius: 0,
          tableLayout: "fixed"
        }}>
          <thead>
            <tr>
              <th style={{
                position: "sticky",   // <-- Add this
                top: 0,               // <-- And this
                background: "#f3f4f6",
                zIndex: 5,            // <-- Make sure it's above body rows
                width: 32,
                border: "1px solid #e5e7eb"
              }}></th>
              <th style={{
                position: "sticky",
                top: 0,
                background: "#f3f4f6",
                color: "#23272e",
                fontWeight: 700,
                fontSize: 13,
                border: "1px solid #e5e7eb",
                padding: "8px 5px",
                textAlign: "left",
                width: 82,
                zIndex: 5
              }}>Model</th>
              <th style={{
                position: "sticky",
                top: 0,
                background: "#f3f4f6",
                color: "#23272e",
                fontWeight: 700,
                fontSize: 13,
                border: "1px solid #e5e7eb",
                padding: "8px 5px",
                textAlign: "left",
                width: 50,
                zIndex: 5
              }}>Pb. Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, i) => (
              <tr key={m.id}
                style={{
                  background: selectedIds.has(m.id)
                    ? "#e6ecff"
                    : (i % 2 === 0 ? "#f9fafb" : "#f3f4f6"),
                  cursor: "pointer"
                }}
                onClick={() => handleRowClick(m)}
              >
                {/* Radio or checkbox based on mode */}
                <td style={{
                  border: "1px solid #e5e7eb",
                  padding: 0,
                  textAlign: "center",
                  width: 32,
                  verticalAlign: "middle",
                  height: 20,
                  minHeight: 20
                }}>
                  {compareMode ? (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(m.id)}
                      style={{
                        width: 15, height: 15, accentColor: "#64748b", borderRadius: 2
                      }}
                      onChange={e => {
                        e.stopPropagation();
                        setSelectedIds(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(m.id)) newSet.delete(m.id); else newSet.add(m.id);
                          return newSet;
                        });
                      }}
                    />
                  ) : (
                    <input
                      type="radio"
                      checked={selectedIds.has(m.id)}
                      name="sidebar-model-select"
                      style={{
                        width: 15, height: 15, accentColor: "#64748b"
                      }}
                      onChange={e => {
                        e.stopPropagation();
                        handleRadioChange(m.id);
                      }}
                    />
                  )}
                </td>
                <td style={{
                  border: "1px solid #e5e7eb",
                  fontWeight: 600,
                  letterSpacing: "0.01em",
                  fontSize: 13,
                  color: "#22223b",
                  padding: "2px 5px",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  maxWidth: 90
                }}>
                  {(m.id || "").slice(0, 9)}
                </td>
                <td style={{
                  border: "1px solid #e5e7eb",
                  color: "#5c677d",
                  fontWeight: 500,
                  fontSize: 12,
                  padding: "2px 5px"
                }}>
                  {m.exactDate
                    ? formatMonthYear(m.exactDate, m.year)
                    : m.year}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
