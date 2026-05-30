import { Link, useLocation } from "react-router-dom";

const MobileNav = () => {
    const location = useLocation();
    const isActive = (path) => location.pathname === path;

    const tabs = [
        {
            label: "Feed",
            path: "/",
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
            ),
        },
        {
            label: "Following",
            path: "/following",
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            ),
        },
        {
            label: "Alerts",
            path: "/notifications",
            badge: 4,
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
            ),
        },
        {
            label: "Saved",
            path: "/saved",
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
            ),
        },
        {
            label: "Profile",
            path: "/R_coredev",
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
            ),
        },
    ];

    return (
        <nav className="mobile-nav">
            {tabs.map((tab) => (
                <Link
                    key={tab.label}
                    to={tab.path}
                    className={`mobile-tab${isActive(tab.path) ? " active" : ""}`}
                >
                    <div style={{ position: "relative", display: "inline-flex" }}>
                        {tab.icon}
                        {tab.badge && (
                            <span style={{
                                position: "absolute",
                                top: "-4px",
                                right: "-6px",
                                background: "var(--accent)",
                                color: "var(--accent-text)",
                                fontSize: "0.6rem",
                                fontWeight: 700,
                                padding: "0.1rem 0.35rem",
                                borderRadius: "9999px",
                                lineHeight: 1.4,
                            }}>{tab.badge}</span>
                        )}
                    </div>
                    <span style={{ fontSize: "0.65rem", fontWeight: 500, marginTop: "0.2rem" }}>{tab.label}</span>
                </Link>
            ))}
        </nav>
    );
};

export default MobileNav;