import { Outlet, useNavigate, Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { useAuthStore, useProfileStore, usePostStore } from "../../store/store";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import debounce from "lodash/debounce";

export default function Layout() {
  const navigate = useNavigate();
  const {
    peopleToFollow,
    fetchPeopleToFollow,
    isLoadingPeopleToFollow,
    followUser,
    unfollowUser,
  } = useProfileStore();
  const { token, isAuthenticated } = useAuthStore();
  const { searchUsers, searchPosts, isSearching, search, clearSearch } =
    usePostStore();

  const fetchedRef = useRef(false);
  const searchBoxRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);

  const debouncedSearch = useMemo(
    () => debounce((value, tok) => search(value, tok), 350),
    [search],
  );

  useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);

  const handleSearchChange = useCallback(
    (e) => {
      const value = e.target.value;
      setSearchTerm(value);
      setShowResults(true);
      if (!value.trim()) {
        debouncedSearch.cancel();
        clearSearch();
        return;
      }
      debouncedSearch(value, token);
    },
    [debouncedSearch, clearSearch, token],
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const highlightMatch = (text, term) => {
    if (!text || !term.trim()) return text;
    const words = term.trim().split(/\s+/).filter(Boolean);
    const pattern = new RegExp(
      `(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
      "ig",
    );
    const parts = text.split(pattern);
    return parts.map((part, i) =>
      words.some((w) => w.toLowerCase() === part.toLowerCase()) ? (
        <mark
          key={i}
          style={{
            background: "var(--accent)",
            color: "#fff",
            borderRadius: "3px",
          }}
        >
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  const goToResult = (path) => {
    setShowResults(false);
    setSearchTerm("");
    clearSearch();
    navigate(path);
  };

  useEffect(() => {
    if (!fetchedRef.current && isAuthenticated) {
      fetchPeopleToFollow(token);
      fetchedRef.current = true;
    }
  }, [fetchPeopleToFollow, isAuthenticated, token]);

  const handleFollow = async (username, isFollowing) => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    if (isFollowing) unfollowUser(username, token);
    else followUser(username, token);
  };

  return (
    <div className="layout-grid">
      <Sidebar />
      <main
        style={{
          borderRight: "1px solid var(--border)",
          borderLeft: "1px solid var(--border)",
          minHeight: "100vh",
          padding: "0 1.5rem",
          paddingBottom: "80px",
          marginBottom: "0",
        }}
      >
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <Outlet />
        </div>
      </main>
      <aside className="sidebar-right" style={{ paddingRight: "0.5rem" }}>
        <div
          ref={searchBoxRef}
          style={{ position: "relative", marginBottom: "1.5rem" }}
        >
          <input
            type="text"
            placeholder="Search flock…"
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={(e) => {
              e.target.style.borderColor = "var(--accent)";
              if (searchTerm.trim()) setShowResults(true);
            }}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
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

          {showResults && searchTerm.trim() && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: 0,
                right: 0,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
                maxHeight: "420px",
                overflowY: "auto",
                zIndex: 50,
              }}
            >
              {isSearching ? (
                <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      border: "2px solid var(--border)",
                      borderTopColor: "var(--accent)",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                      margin: "0 auto",
                    }}
                  />
                </div>
              ) : searchUsers.length === 0 && searchPosts.length === 0 ? (
                <div
                  style={{
                    padding: "1.25rem 1rem",
                    textAlign: "center",
                    color: "var(--text3)",
                    fontSize: "0.85rem",
                  }}
                >
                  No results for "{searchTerm}"
                </div>
              ) : (
                <>
                  {searchUsers.length > 0 && (
                    <div style={{ padding: "0.6rem 0.9rem 0.3rem" }}>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                          color: "var(--text3)",
                          marginBottom: "0.4rem",
                        }}
                      >
                        People
                      </div>
                      {searchUsers.map((u) => (
                        <div
                          key={u.username}
                          onClick={() => goToResult(`/${u.username}`)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "0.5rem 0.25rem",
                            cursor: "pointer",
                            borderRadius: "8px",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "var(--border)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              overflow: "hidden",
                              flexShrink: 0,
                              backgroundColor: "#e0e0e0",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontWeight: 600,
                              fontSize: "0.8rem",
                            }}
                          >
                            {u.avatar ? (
                              <img
                                src={u.avatar}
                                alt={u.display_name || u.username}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              u.display_name?.charAt(0) || u.username?.charAt(0)
                            )}
                          </div>
                          <div style={{ marginLeft: "0.6rem", minWidth: 0 }}>
                            <div
                              style={{ fontSize: "0.85rem", fontWeight: 600 }}
                            >
                              {highlightMatch(u.display_name, searchTerm)}
                            </div>
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--text3)",
                              }}
                            >
                              @{highlightMatch(u.username, searchTerm)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchPosts.length > 0 && (
                    <div style={{ padding: "0.3rem 0.9rem 0.6rem" }}>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                          color: "var(--text3)",
                          margin: "0.5rem 0 0.4rem",
                        }}
                      >
                        Posts
                      </div>
                      {searchPosts.map((p) => (
                        <div
                          key={p.id}
                          onClick={() =>
                            goToResult(`/${p.user.username}/post/${p.id}`)
                          }
                          style={{
                            padding: "0.5rem 0.25rem",
                            cursor: "pointer",
                            borderRadius: "8px",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "var(--border)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                            @{p.user.username}
                          </div>
                          <div
                            style={{
                              fontSize: "0.82rem",
                              color: "var(--text2, var(--text))",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {highlightMatch(p.content, searchTerm)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="widget" style={{ marginTop: "0.5rem" }}>
          <div
            className="widget-title"
            style={{ marginBottom: "1rem", fontWeight: 600 }}
          >
            People to follow
          </div>
          {!isAuthenticated ? (
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <p
                style={{
                  color: "var(--text3)",
                  fontSize: "0.85rem",
                  margin: "0 0 0.75rem 0",
                }}
              >
                Sign in to see who to follow
              </p>
              <button
                onClick={() => navigate("/auth")}
                style={{
                  padding: "0.4rem 1.2rem",
                  borderRadius: "20px",
                  background: "var(--accent)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                }}
              >
                Sign in
              </button>
            </div>
          ) : isLoadingPeopleToFollow ? (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  border: "2px solid var(--border)",
                  borderTopColor: "var(--accent)",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  margin: "0 auto",
                }}
              />
              <style>
                {`
                  @keyframes spin {
                    to { transform: rotate(360deg); }
                  }
                `}
              </style>
            </div>
          ) : (
            peopleToFollow.map((u) => (
              <div
                key={u.username}
                className="person-row"
                style={{ marginBottom: "1rem" }}
              >
                <Link
                  to={`/${u.username}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    textDecoration: "none",
                    color: "var(--text)",
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <div
                    className="avatar"
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "50%",
                      overflow: "hidden",
                      flexShrink: 0,
                      backgroundColor: "#e0e0e0",
                    }}
                  >
                    {u.avatar ? (
                      <img
                        src={u.avatar}
                        alt={u.display_name || u.username}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          backgroundColor: "#e0e0e0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontWeight: 600,
                        }}
                      >
                        {u.display_name?.charAt(0) || u.username?.charAt(0)}
                      </div>
                    )}
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
                      {u.display_name}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text3)" }}>
                      @{u.username}
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => handleFollow(u.username, u.is_following)}
                  className="follow-btn"
                  style={{
                    padding: "0.35rem 0.85rem",
                    fontSize: "0.75rem",
                    borderRadius: "20px",
                    background: u.is_following
                      ? "var(--accent)"
                      : "transparent",
                    border: `1px solid ${u.is_following ? "var(--accent)" : "var(--border)"}`,
                    color: u.is_following ? "#fff" : "var(--text)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    flexShrink: 0,
                    marginLeft: "0.5rem",
                  }}
                >
                  {u.is_following ? "Following" : "Follow"}
                </button>
              </div>
            ))
          )}
        </div>
      </aside>
      <MobileNav />
    </div>
  );
}
