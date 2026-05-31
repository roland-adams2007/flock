import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";

export default function Layout() {
  return (
    <div
      style={{
        maxWidth: "1300px",
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "260px 1fr 300px",
        minHeight: "100vh",
      }}
      className="layout-grid"
    >
      <Sidebar />
      <main
        style={{
          borderRight: "1px solid var(--border)",
          borderLeft: "1px solid var(--border)",
          minHeight: "100vh",
          padding: "0 1.5rem",
        }}
      >
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <Outlet />
        </div>
      </main>
      <aside className="sidebar-right" style={{ paddingRight: "0.5rem" }}>
        <div style={{ position: "relative", marginBottom: "1.5rem" }}>
          <input
            type="text"
            placeholder="Search flock…"
            style={{
              width: "100%",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "0.65rem 0.9rem 0.65rem 2.35rem",
              fontFamily: "'Instrument Sans', sans-serif",
              fontSize: "0.9rem",
              color: "var(--text)",
              outline: "none",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
          <svg
            style={{
              position: "absolute",
              left: "0.75rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text3)",
              pointerEvents: "none",
            }}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        <div className="widget" style={{ marginTop: "0.5rem" }}>
          <div
            className="widget-title"
            style={{ marginBottom: "1rem", fontWeight: 600 }}
          >
            People to follow
          </div>
          {[
            {
              id: 1,
              name: "Akintola Steve",
              handle: "AkintolaDev",
              initials: "AS",
              bg: "#1a1e2e",
              fg: "#7eb8f7",
            },
            {
              id: 2,
              name: "Chiamaka Obi",
              handle: "chiamaka_obi",
              initials: "CO",
              bg: "#2a1a2e",
              fg: "#d07ef7",
            },
            {
              id: 3,
              name: "Tunde Builds",
              handle: "TundeBuilds",
              initials: "TB",
              bg: "#1e2a1a",
              fg: "#7ef7a4",
            },
          ].map((u) => (
            <div
              key={u.id}
              className="person-row"
              style={{ marginBottom: "1rem" }}
            >
              <div
                className="avatar"
                style={{
                  width: "38px",
                  height: "38px",
                  background: u.bg,
                  color: u.fg,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {u.initials}
              </div>
              <div style={{ minWidth: 0, flex: 1, marginLeft: "0.75rem" }}>
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {u.name}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text3)" }}>
                  @{u.handle}
                </div>
              </div>
              <button
                className="follow-btn"
                style={{
                  padding: "0.35rem 0.85rem",
                  fontSize: "0.75rem",
                  borderRadius: "20px",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  flexShrink: 0,
                  marginLeft: "0.5rem",
                }}
              >
                Follow
              </button>
            </div>
          ))}
        </div>
      </aside>
      <MobileNav />
    </div>
  );
}
