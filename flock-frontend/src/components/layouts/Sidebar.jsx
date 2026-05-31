import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuthStore } from "../../store/store";
import logo from "../../assets/logo.png";

function SidebarSkeleton() {
  return (
    <div
      className="me-row"
      style={{ cursor: "default", pointerEvents: "none" }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "var(--surface2)",
          flexShrink: 0,
          animation: "pulse 1.4s ease-in-out infinite",
        }}
      />
      <div
        style={{
          minWidth: 0,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "0.45rem",
        }}
      >
        <div
          style={{
            width: "65%",
            height: 11,
            background: "var(--surface2)",
            borderRadius: 5,
            animation: "pulse 1.4s ease-in-out infinite",
          }}
        />
        <div
          style={{
            width: "42%",
            height: 9,
            background: "var(--surface2)",
            borderRadius: 5,
            animation: "pulse 1.4s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
}

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeText, setComposeText] = useState("");

  const { token, me, isAuthenticated, isInitializing, logout } = useAuthStore();
  const isActive = (path) => location.pathname === path;

  const navItems = [
    {
      label: "Feed",
      path: "/",
      icon: (
        <svg
          width="18"
          height="18"
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
      label: "Notifications",
      path: "/notifications",
      badge: 4,
      requiresAuth: true,
      icon: (
        <svg
          width="18"
          height="18"
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
      label: "Following",
      path: `/${me?.username}/follows`,
      requiresAuth: true,
      icon: (
        <svg
          width="18"
          height="18"
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
      label: "Profile",
      path: me?.username ? `/${me?.username}` : null,
      requiresAuth: true,
      icon: (
        <svg
          width="18"
          height="18"
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
    {
      label: "Saved",
      path: "/saved",
      requiresAuth: true,
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
  ];

  const handleNavClick = (item) => {
    if (item.requiresAuth && !isAuthenticated) {
      navigate("/auth");
      return;
    }
    if (item.onClick) {
      item.onClick();
      return;
    }
    if (item.path) navigate(item.path);
  };

  return (
    <>
      <aside className="sidebar-left">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Flock" className="h-18 w-auto object-contain" />
        </div>

        {navItems.map((item) => {
          const active = item.path ? isActive(item.path) : false;
          const hasPath = item.path && (!item.requiresAuth || isAuthenticated);
          if (hasPath) {
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`nav-item${active ? " active" : ""}`}
              >
                {item.icon}
                {item.label}
                {item.badge && isAuthenticated && (
                  <span className="badge">{item.badge}</span>
                )}
              </Link>
            );
          }
          return (
            <button
              key={item.label}
              className={`nav-item${active ? " active" : ""}`}
              onClick={() => handleNavClick(item)}
            >
              {item.icon}
              {item.label}
              {item.badge && isAuthenticated && (
                <span className="badge">{item.badge}</span>
              )}
            </button>
          );
        })}

        {isAuthenticated && (
          <button className="cta-btn" onClick={() => setComposeOpen(true)}>
            + New Post
          </button>
        )}

        <div style={{ marginTop: "auto" }}>
          {isInitializing ? (
            <SidebarSkeleton />
          ) : isAuthenticated && me ? (
            <div
              className="me-row"
              style={{ cursor: "pointer" }}
              onClick={() => me.username && navigate(`/${me.username}`)}
            >
              {me.avatar ? (
                <img
                  src={me.avatar}
                  alt={me.display_name}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  className="avatar"
                  style={{
                    width: 36,
                    height: 36,
                    background: "#1e2d14",
                    color: "var(--accent)",
                    flexShrink: 0,
                  }}
                >
                  {getInitials(me.display_name)}
                </div>
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {me.display_name}
                </div>
                <div style={{ fontSize: "0.73rem", color: "var(--text3)" }}>
                  @{me.username}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  logout();
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text3)",
                  padding: "0.2rem",
                  borderRadius: 6,
                  flexShrink: 0,
                }}
                title="Log out"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          ) : isAuthenticated && !me ? (
            <SidebarSkeleton />
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.55rem",
              }}
            >
              <button
                className="cta-btn"
                onClick={() => navigate("/auth")}
                style={{ margin: 0 }}
              >
                Sign in
              </button>
              <button
                onClick={() => navigate("/auth")}
                style={{
                  background: "transparent",
                  border: "1.5px solid var(--border2)",
                  borderRadius: "22px",
                  padding: "0.55rem 1rem",
                  fontFamily: "'Instrument Sans', sans-serif",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--text2)",
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                Create account
              </button>
            </div>
          )}
        </div>
      </aside>

      {composeOpen && isAuthenticated && (
        <div
          className="modal-bg open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setComposeOpen(false);
          }}
        >
          <div className="modal-box">
            <div className="modal-head">
              <div className="serif" style={{ fontSize: "1.1rem" }}>
                New Post
              </div>
              <button
                className="close-btn"
                onClick={() => setComposeOpen(false)}
              >
                ✕
              </button>
            </div>
            <div style={{ display: "flex", gap: "0.9rem" }}>
              {me?.avatar ? (
                <img
                  src={me.avatar}
                  alt=""
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  className="avatar"
                  style={{
                    width: 40,
                    height: 40,
                    background: "#1e2d14",
                    color: "var(--accent)",
                    flexShrink: 0,
                  }}
                >
                  {getInitials(me?.display_name)}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <textarea
                  rows="4"
                  className="compose-textarea"
                  placeholder="What's happening?"
                  style={{
                    fontSize: "1rem",
                    minHeight: "110px",
                    width: "100%",
                  }}
                  value={composeText}
                  onChange={(e) => setComposeText(e.target.value)}
                  autoFocus
                />
                <div
                  style={{
                    borderTop: "1px solid var(--border)",
                    paddingTop: "0.75rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: "0.75rem",
                  }}
                >
                  <button className="icon-btn">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </button>
                  <button
                    className="post-btn-sm"
                    onClick={() => {
                      setComposeText("");
                      setComposeOpen(false);
                    }}
                    style={{ padding: "0.5rem 1.4rem", fontSize: "0.875rem" }}
                  >
                    Post it
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
