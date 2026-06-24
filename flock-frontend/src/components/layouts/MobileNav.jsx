import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/store";

const MobileNav = () => {
  const location = useLocation();
  const { isAuthenticated, logout, me } = useAuthStore();
  const isActive = (path) => location.pathname === path;

  const tabs = [
    {
      label: "Feed",
      path: "/",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      label: "Following",
      path: `/${me?.username}/follows`,
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      label: "Notifications",
      path: "/notifications",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
    },
    {
      label: "Profile",
      path: `/${me?.username}`,
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  const allTabs = isAuthenticated
    ? [
        ...tabs,
        {
          label: "Sign Out",
          path: "#",
          onClick: logout,
          icon: (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          ),
        },
      ]
    : tabs;

  return (
    <nav
      className="mobile-nav"
      style={{
        display: "flex",
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: "var(--bg)",
        borderTop: "1px solid var(--border)",
        justifyContent: "space-around",
        alignItems: "center",
        padding: "0.5rem 0.25rem",
        height: "60px",
      }}
    >
      <style>
        {`
          @media (min-width: 769px) {
            .mobile-nav {
              display: none !important;
            }
          }
        `}
      </style>

      {allTabs.map((tab) => {
        const isTabActive = tab.path !== "#" && isActive(tab.path);

        return (
          <Link
            key={tab.label}
            to={tab.path}
            className={`mobile-tab${isTabActive ? " active" : ""}`}
            onClick={(e) => {
              if (tab.onClick) {
                e.preventDefault();
                tab.onClick();
              }
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
              color: isTabActive ? "var(--accent)" : "var(--text3)",
              fontSize: "0.65rem",
              fontWeight: 500,
              padding: "0.25rem 0.5rem",
              flex: 1,
              gap: "0.15rem",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <div style={{ position: "relative", display: "inline-flex" }}>
              {tab.icon}
            </div>
            <span style={{ fontSize: "0.6rem", fontWeight: 500 }}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileNav;
