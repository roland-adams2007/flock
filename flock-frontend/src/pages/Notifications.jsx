import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/store";
import { useNotificationStore } from "../store/modules/notificationStore";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
  });
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

// Maps notification types to a readable label + icon
function resolveType(notification) {
  // Use the cleaned-up type from the backend
  const type = notification.type ?? "";
  const message = notification.message ?? "";

  if (type === "like") {
    return { label: "liked your post", icon: "❤️" };
  }
  if (type === "repost") {
    return { label: "reposted your post", icon: "🔁" };
  }
  if (type === "follow") {
    return { label: "followed you", icon: "👤" };
  }
  if (type === "reply" || type === "comment") {
    return { label: "replied to your post", icon: "💬" };
  }
  if (type === "mention") {
    return { label: "mentioned you", icon: "🔔" };
  }

  // Fallback: use the message field or a generic label
  return { label: message || "sent you a notification", icon: "🔔" };
}

function SkeletonRow() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.85rem",
        padding: "1rem 1.25rem",
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
          gap: "0.45rem",
        }}
      >
        <div
          style={{
            width: "60%",
            height: 12,
            background: "var(--surface2)",
            borderRadius: 5,
            animation: "pulse 1.4s ease-in-out infinite",
          }}
        />
        <div
          style={{
            width: "40%",
            height: 10,
            background: "var(--surface2)",
            borderRadius: 5,
            animation: "pulse 1.4s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
}

function NotificationRow({ notification, navigate }) {
  // Use the cleaned-up structure
  const sender = notification.sender ?? {};
  const isUnread = !notification.is_read; // Use the explicit is_read flag
  const { label, icon } = resolveType(notification);
  const { me } = useAuthStore();
  const actorName = sender.name || "Someone";
  const actorAvatar = sender.avatar;
  const actorUsername = sender.username;
  const message = notification.message || "";
  const sourceId = notification.source_id;

  // Handle click on the notification
  const handleClick = () => {
    if (notification.source_id && actorUsername) {
      navigate(`/${me?.username}/post/${notification.source_id}`);
    } else if (actorUsername) {
      navigate(`/${actorUsername}`); // Use username in URL
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.85rem",
        padding: "0.9rem 1.25rem",
        borderBottom: "1px solid var(--border)",
        cursor: "pointer",
        background: isUnread ? "var(--surface)" : "transparent",
        transition: "background 0.15s",
        position: "relative",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "var(--surface2)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = isUnread
          ? "var(--surface)"
          : "transparent")
      }
    >
      {/* Unread dot */}
      {isUnread && (
        <div
          style={{
            position: "absolute",
            left: "0.45rem",
            top: "50%",
            transform: "translateY(-50%)",
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--accent)",
          }}
        />
      )}

      {/* Avatar */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        {actorAvatar ? (
          <img
            src={actorAvatar}
            alt={actorName}
            onClick={(e) => {
              e.stopPropagation();
              if (actorUsername) navigate(`/${actorUsername}`);
            }}
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              objectFit: "cover",
              cursor: "pointer",
            }}
          />
        ) : (
          <div
            className="avatar"
            style={{ width: 42, height: 42, cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              if (actorUsername) navigate(`/${actorUsername}`);
            }}
          >
            {getInitials(actorName)}
          </div>
        )}
        {/* Type icon badge */}
        <span
          style={{
            position: "absolute",
            bottom: -2,
            right: -4,
            fontSize: "0.75rem",
            lineHeight: 1,
          }}
        >
          {icon}
        </span>
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.875rem", lineHeight: 1.45 }}>
          <span
            style={{ fontWeight: 700, cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              if (actorUsername) navigate(`/${actorUsername}`);
            }}
          >
            {actorName}
          </span>{" "}
          <span style={{ color: "var(--text2)" }}>{label}</span>
        </div>
        {message && message !== label && (
          <div
            style={{
              fontSize: "0.8rem",
              color: "var(--text3)",
              marginTop: "0.25rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {message}
          </div>
        )}
        <div
          style={{
            fontSize: "0.75rem",
            color: "var(--text3)",
            marginTop: "0.2rem",
          }}
        >
          {timeAgo(notification.created_at)}
        </div>
      </div>
    </div>
  );
}

const Notifications = () => {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuthStore();
  const {
    notifications,
    unreadCount,
    isLoading,
    page,
    lastPage,
    fetchNotifications,
    markAllAsRead,
    clearNotifications,
  } = useNotificationStore();

  const sentinelRef = useRef(null);
  const markedRef = useRef(false);

  // Initial load
  useEffect(() => {
    if (!isAuthenticated) return;
    clearNotifications();
    fetchNotifications(token, 1);
  }, [token, isAuthenticated]);

  // Mark all as read once on mount (after a tiny delay so fetch fires first)
  useEffect(() => {
    if (!isAuthenticated || markedRef.current) return;
    markedRef.current = true;
    const timer = setTimeout(() => markAllAsRead(token), 800);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  // Infinite scroll
  const loadMore = useCallback(() => {
    if (isLoading || page >= lastPage) return;
    fetchNotifications(token, page + 1);
  }, [isLoading, page, lastPage, token]);

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

  if (!isAuthenticated) {
    return (
      <div
        style={{
          padding: "3rem 1.5rem",
          textAlign: "center",
          color: "var(--text3)",
        }}
      >
        <p>Sign in to see your notifications</p>
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

  return (
    <div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }`}</style>

      {/* Header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "var(--bg)",
          borderBottom: "1px solid var(--border)",
          padding: "1rem 1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: "1rem" }}>
          Notifications
          {unreadCount > 0 && (
            <span
              style={{
                marginLeft: "0.5rem",
                background: "var(--accent)",
                color: "#fff",
                fontSize: "0.7rem",
                fontWeight: 700,
                padding: "0.1rem 0.45rem",
                borderRadius: 999,
              }}
            >
              {unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* List */}
      {isLoading && notifications.length === 0 ? (
        [1, 2, 3, 4, 5].map((k) => <SkeletonRow key={k} />)
      ) : notifications.length === 0 ? (
        <div
          style={{
            padding: "4rem 1.5rem",
            textAlign: "center",
            color: "var(--text3)",
            fontSize: "0.875rem",
          }}
        >
          No notifications yet
        </div>
      ) : (
        <>
          {notifications.map((n) => (
            <NotificationRow key={n.id} notification={n} navigate={navigate} />
          ))}
          {isLoading && [1, 2].map((k) => <SkeletonRow key={k} />)}
          <div ref={sentinelRef} style={{ height: 1 }} />
        </>
      )}
    </div>
  );
};

export default Notifications;
