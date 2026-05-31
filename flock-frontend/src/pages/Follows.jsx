import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuthStore, useProfileStore } from "../store/store";

const API_BASE = import.meta.env.VITE_API_URL;

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Avatar({ src, name, size = 42 }) {
  if (src) {
    return (
      <img
        src={src}
        loading="lazy"
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div
      className="avatar"
      style={{ width: size, height: size, flexShrink: 0 }}
    >
      {getInitials(name)}
    </div>
  );
}

function SkeletonRow() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.85rem",
        padding: "0.85rem 1.25rem",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: "50%",
          background: "var(--surface2)",
          flexShrink: 0,
          animation: "pulse 1.4s ease-in-out infinite",
        }}
      />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "0.4rem",
        }}
      >
        <div
          style={{
            width: "45%",
            height: 12,
            background: "var(--surface2)",
            borderRadius: 5,
            animation: "pulse 1.4s ease-in-out infinite",
          }}
        />
        <div
          style={{
            width: "30%",
            height: 10,
            background: "var(--surface2)",
            borderRadius: 5,
            animation: "pulse 1.4s ease-in-out infinite",
          }}
        />
      </div>
      <div
        style={{
          width: 72,
          height: 30,
          background: "var(--surface2)",
          borderRadius: 20,
          animation: "pulse 1.4s ease-in-out infinite",
        }}
      />
    </div>
  );
}

function UserRow({ user, token, currentUsername }) {
  const navigate = useNavigate();
  const { followUser, unfollowUser } = useProfileStore();
  const [following, setFollowing] = useState(user.is_following ?? false);
  const [loading, setLoading] = useState(false);
  const isMe = currentUsername === user?.username || user.is_me === true;

  const toggle = async (e) => {
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    if (following) {
      await unfollowUser(user?.username, token);
      setFollowing(false);
    } else {
      await followUser(user?.username, token);
      setFollowing(true);
    }
    setLoading(false);
  };

  return (
    <div
      onClick={() => navigate(`/${user?.username}`)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.85rem",
        padding: "0.85rem 1.25rem",
        cursor: "pointer",
        borderBottom: "1px solid var(--border)",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "var(--surface2)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
    >
      <Avatar src={user.avatar} name={user.display_name} size={42} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: "0.9rem",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {user.display_name}
        </div>
        <div style={{ color: "var(--text3)", fontSize: "0.8rem" }}>
          @{user?.username}
        </div>
        {user.bio && (
          <div
            style={{
              fontSize: "0.8rem",
              color: "var(--text2)",
              marginTop: "0.2rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user.bio}
          </div>
        )}
      </div>
      {!isMe && token && (
        <button
          onClick={toggle}
          disabled={loading}
          style={{
            background: following ? "transparent" : "var(--accent)",
            color: following ? "var(--text2)" : "var(--accent-text)",
            border: following ? "1.5px solid var(--border2)" : "none",
            borderRadius: 20,
            padding: "0.4rem 1rem",
            fontSize: "0.8rem",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'Instrument Sans', sans-serif",
            flexShrink: 0,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "…" : following ? "Following" : "Follow"}
        </button>
      )}
    </div>
  );
}

const Follows = () => {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuthStore();
  const {
    followers,
    following,
    isLoadingFollowers,
    isLoadingFollowing,
    fetchFollowers,
    fetchFollowing,
    clearFollowers,
    clearFollowing,
  } = useProfileStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("t") || "followers";
  const { username } = useParams();

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [localList, setLocalList] = useState([]);
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!username) return;
    setPage(1);
    setLastPage(1);
    setLocalList([]);

    const load = async () => {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const endpoint =
        activeTab === "followers"
          ? `${API_BASE}/profile/${username}/followers`
          : `${API_BASE}/profile/${username}/following`;
      try {
        const res = await fetch(`${endpoint}?page=1`, { headers });
        const data = await res.json();
        if (data.success) {
          const items =
            activeTab === "followers" ? data.followers : data.following;
          setLocalList(items);
          if (data.meta) setLastPage(data.meta.last_page ?? 1);
        }
      } catch {}
    };

    load();
  }, [username, activeTab, token]);

  const loadMore = useCallback(async () => {
    if (page >= lastPage) return;
    const nextPage = page + 1;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const endpoint =
      activeTab === "followers"
        ? `${API_BASE}/profile/${username}/followers`
        : `${API_BASE}/profile/${username}/following`;
    try {
      const res = await fetch(`${endpoint}?page=${nextPage}`, { headers });
      const data = await res.json();
      if (data.success) {
        const items =
          activeTab === "followers" ? data.followers : data.following;
        setLocalList((prev) => [...prev, ...items]);
        setPage(nextPage);
        if (data.meta) setLastPage(data.meta.last_page ?? lastPage);
      }
    } catch {}
  }, [page, lastPage, activeTab, username, token]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

  const handleTabChange = (tab) => {
    setSearchParams({ t: tab });
  };

  if (!isAuthenticated) {
    return (
      <div
        style={{
          padding: "3rem 1.5rem",
          textAlign: "center",
          color: "var(--text3)",
        }}
      >
        <p>Sign in to see connections</p>
        <button
          className="cta-btn"
          style={{ marginTop: "1rem" }}
          onClick={() => navigate("/auth")}
        >
          Sign in
        </button>
      </div>
    );
  }

  const isLoading =
    activeTab === "followers" ? isLoadingFollowers : isLoadingFollowing;

  return (
    <div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }`}</style>

      <div className="profile-header-bar">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Connections</div>
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
        {["followers", "following"].map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0.85rem 0",
              fontSize: "0.875rem",
              fontWeight: activeTab === tab ? 700 : 500,
              color: activeTab === tab ? "var(--text)" : "var(--text3)",
              borderBottom:
                activeTab === tab
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
              fontFamily: "'Instrument Sans', sans-serif",
              textTransform: "capitalize",
              transition: "all 0.15s",
            }}
          >
            {tab === "followers" ? "Followers" : "Following"}
          </button>
        ))}
      </div>

      <div>
        {localList.length === 0 && !isLoading ? (
          <div
            style={{
              padding: "3rem 1.5rem",
              textAlign: "center",
              color: "var(--text3)",
              fontSize: "0.875rem",
            }}
          >
            No {activeTab === "followers" ? "followers" : "following"} yet
          </div>
        ) : (
          <>
            {localList.map((u) => (
              <UserRow
                key={u.username}
                user={u}
                token={token}
                currentUsername={username}
              />
            ))}
            {isLoading && [1, 2, 3].map((k) => <SkeletonRow key={k} />)}
            <div ref={sentinelRef} style={{ height: 1 }} />
          </>
        )}
      </div>
    </div>
  );
};

export default Follows;
