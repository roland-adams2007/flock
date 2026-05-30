import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";

export default function Layout() {
    return (
        <div style={{ maxWidth: "1060px", margin: "0 auto", display: "grid", gridTemplateColumns: "220px 1fr 230px", minHeight: "100vh" }} className="layout-grid">
            <Sidebar />
            <main style={{ borderRight: "1px solid var(--border)", minHeight: "100vh" }}>
                <Outlet />
            </main>
            <aside className="sidebar-right">
                <div style={{ position: "relative" }}>
                    <input
                        type="text"
                        placeholder="Search flock…"
                        style={{
                            width: "100%",
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            borderRadius: "10px",
                            padding: "0.55rem 0.9rem 0.55rem 2.35rem",
                            fontFamily: "'Instrument Sans', sans-serif",
                            fontSize: "0.85rem",
                            color: "var(--text)",
                            outline: "none",
                        }}
                        onFocus={e => e.target.style.borderColor = "var(--accent)"}
                        onBlur={e => e.target.style.borderColor = "var(--border)"}
                    />
                    <svg style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text3)", pointerEvents: "none" }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                </div>

                <div className="widget">
                    <div className="widget-title">People to follow</div>
                    {[
                        { id: 1, name: "Akintola Steve", handle: "AkintolaDev", initials: "AS", bg: "#1a1e2e", fg: "#7eb8f7" },
                        { id: 2, name: "Chiamaka Obi", handle: "chiamaka_obi", initials: "CO", bg: "#2a1a2e", fg: "#d07ef7" },
                        { id: 3, name: "Tunde Builds", handle: "TundeBuilds", initials: "TB", bg: "#1e2a1a", fg: "#7ef7a4" },
                    ].map(u => (
                        <div key={u.id} className="person-row">
                            <div className="avatar" style={{ width: "34px", height: "34px", background: u.bg, color: u.fg }}>{u.initials}</div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: "0.82rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name}</div>
                                <div style={{ fontSize: "0.73rem", color: "var(--text3)" }}>@{u.handle}</div>
                            </div>
                            <button className="follow-btn">Follow</button>
                        </div>
                    ))}
                </div>

                <div className="widget">
                    <div className="widget-title">Topics</div>
                    <div style={{ display: "flex", flexWrap: "wrap", margin: "-0.2rem" }}>
                        {["#LagosTech", "#BuildInPublic", "#SystemDesign", "#OpenSource", "#Startups", "#UIDesign", "#RemoteWork", "#JavaScript"].map(t => (
                            <span key={t} className="tag-pill">{t}</span>
                        ))}
                    </div>
                </div>
            </aside>
            <MobileNav />
        </div>
    );
}