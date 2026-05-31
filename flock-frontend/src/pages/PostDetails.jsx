import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore, usePostStore, useProfileStore } from "../store/store";

function fmt(n) {
  if (!n && n !== 0) return "0";
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000)
    return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "K";
  return String(n);
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

function Avatar({ src, name, size = 38, onClick }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        onClick={onClick}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          cursor: onClick ? "pointer" : "default",
        }}
      />
    );
  }
  return (
    <div
      className="avatar"
      onClick={onClick}
      style={{
        width: size,
        height: size,
        background: "#1e2d14",
        color: "var(--accent)",
        flexShrink: 0,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {getInitials(name)}
    </div>
  );
}

function SkeletonLine({ w, h = 12 }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        background: "var(--surface2)",
        borderRadius: 6,
        animation: "skelPulse 1.4s ease-in-out infinite",
      }}
    />
  );
}

function PostSkeleton() {
  return (
    <div
      style={{
        padding: "1.4rem 1.25rem",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "var(--surface2)",
            flexShrink: 0,
            animation: "skelPulse 1.4s ease-in-out infinite",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            paddingTop: 4,
          }}
        >
          <SkeletonLine w={140} h={14} />
          <SkeletonLine w={90} />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <SkeletonLine w="95%" h={16} />
        <SkeletonLine w="85%" h={16} />
        <SkeletonLine w="60%" h={16} />
      </div>
    </div>
  );
}

function ReplySkeleton() {
  return (
    <div
      style={{
        padding: "1rem 1.25rem",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        gap: "0.8rem",
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: "50%",
          background: "var(--surface2)",
          flexShrink: 0,
          animation: "skelPulse 1.4s ease-in-out infinite",
        }}
      />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "0.45rem",
          paddingTop: 4,
        }}
      >
        <SkeletonLine w="40%" />
        <SkeletonLine w="90%" />
        <SkeletonLine w="70%" />
      </div>
    </div>
  );
}

function MediaGrid({ media, onOpenLightbox }) {
  if (!media || media.length === 0) return null;
  const count = media.length;
  const getGridStyle = () => {
    if (count === 1) return { gridTemplateColumns: "1fr" };
    if (count === 2)
      return { gridTemplateColumns: "1fr 1fr", gridTemplateRows: "220px" };
    if (count === 3)
      return { gridTemplateColumns: "1fr 1fr", gridTemplateRows: "160px 160px" };
    return { gridTemplateColumns: "1fr 1fr", gridTemplateRows: "160px 160px" };
  };
  return (
    <div
      style={{
        display: "grid",
        gap: "0.25rem",
        marginBottom: "1rem",
        borderRadius: "14px",
        overflow: "hidden",
        ...getGridStyle(),
      }}
    >
      {media.slice(0, 4).map((m, index) => (
        <div
          key={m.id}
          style={{
            position: "relative",
            overflow: "hidden",
            cursor: "pointer",
            gridColumn: count === 3 && index === 0 ? "1 / -1" : undefined,
            height:
              count === 1
                ? "auto"
                : count === 3 && index === 0
                  ? 200
                  : undefined,
          }}
          onClick={() => onOpenLightbox(index)}
        >
          {m.type === "video" ? (
            <video
              src={m.path}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              onClick={(e) => e.stopPropagation()}
              controls
            />
          ) : (
            <img
              src={m.path}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          )}
          {count > 4 && index === 3 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.55)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.6rem",
                fontWeight: 700,
                color: "#fff",
              }}
            >
              +{count - 4}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ReplyMediaGrid({ media }) {
  if (!media || media.length === 0) return null;
  const count = media.length;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: count === 1 ? "1fr" : "1fr 1fr",
        gap: "0.25rem",
        marginTop: "0.5rem",
        marginBottom: "0.5rem",
        borderRadius: "10px",
        overflow: "hidden",
      }}
    >
      {media.slice(0, 4).map((m) => (
        <div key={m.id} style={{ position: "relative", overflow: "hidden" }}>
          {m.type === "video" ? (
            <video
              src={m.path}
              controls
              style={{ width: "100%", maxHeight: 160, objectFit: "cover", display: "block" }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={m.path}
              alt=""
              style={{ width: "100%", maxHeight: 160, objectFit: "cover", display: "block" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function MediaPreview({ items, onRemove }) {
  if (!items || items.length === 0) return null;
  return (
    <div
      style={{
        display: "flex",
        gap: "0.5rem",
        flexWrap: "wrap",
        marginTop: "0.5rem",
      }}
    >
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            position: "relative",
            width: 72,
            height: 72,
            borderRadius: 8,
            overflow: "hidden",
            border: "1px solid var(--border)",
          }}
        >
          {item.type === "video" ? (
            <video
              src={item.localUrl}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <img
              src={item.localUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
          <button
            onClick={() => onRemove(i)}
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              background: "rgba(0,0,0,0.65)",
              border: "none",
              borderRadius: "50%",
              width: 20,
              height: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
              padding: 0,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          {item.uploading && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  animation: "spin 0.7s linear infinite",
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Lightbox({
  media,
  startIndex,
  onClose,
  post,
  token,
  myInfo,
  isAuthenticated,
  postId,
  replies,
  isLoadingReplies,
  onSendReply,
}) {
  const [current, setCurrent] = useState(startIndex);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setCurrent((c) => Math.min(c + 1, media.length - 1));
      if (e.key === "ArrowLeft") setCurrent((c) => Math.max(c - 1, 0));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [media.length, onClose]);

  const item = media[current];

  const sendComment = async () => {
    if (!replyText.trim() || replying) return;
    if (!isAuthenticated) { navigate("/auth"); return; }
    setReplying(true);
    await onSendReply(replyText);
    setReplyText("");
    setReplying(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        background: "rgba(0,0,0,0.96)",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          minWidth: 0,
        }}
        onClick={onClose}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            background: "rgba(255,255,255,0.1)",
            border: "none",
            borderRadius: "50%",
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#fff",
            zIndex: 10,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {media.length > 1 && current > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); setCurrent((c) => c - 1); }}
            style={{
              position: "absolute",
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: "50%",
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
              zIndex: 10,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {media.length > 1 && current < media.length - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); setCurrent((c) => c + 1); }}
            style={{
              position: "absolute",
              right: 320 + 16,
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: "50%",
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
              zIndex: 10,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}

        <div
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: "100%", maxHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {item.type === "video" ? (
            <video src={item.path} controls autoPlay style={{ maxWidth: "100%", maxHeight: "100vh", objectFit: "contain" }} />
          ) : (
            <img src={item.path} alt="" style={{ maxWidth: "100%", maxHeight: "100vh", objectFit: "contain" }} />
          )}
        </div>

        {media.length > 1 && (
          <div
            style={{
              position: "absolute",
              bottom: 16,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 6,
            }}
          >
            {media.map((_, i) => (
              <div
                key={i}
                onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                style={{
                  width: i === current ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === current ? "#fff" : "rgba(255,255,255,0.3)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 340,
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          background: "#0f0f11",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "1rem 1.1rem",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            gap: "0.65rem",
            alignItems: "center",
          }}
        >
          <Avatar
            src={post?.user?.avatar}
            name={post?.user?.display_name}
            size={40}
            onClick={() => { onClose(); navigate(`/${post?.user?.username}`); }}
          />
          <div>
            <div
              style={{ fontWeight: 700, fontSize: "0.9rem", color: "#fff", cursor: "pointer" }}
              onClick={() => { onClose(); navigate(`/${post?.user?.username}`); }}
            >
              {post?.user?.display_name}
            </div>
            <div
              style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem", cursor: "pointer" }}
              onClick={() => { onClose(); navigate(`/${post?.user?.username}`); }}
            >
              @{post?.user?.username}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: "1rem 1.1rem",
            fontSize: "0.95rem",
            color: "rgba(255,255,255,0.8)",
            lineHeight: 1.65,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {post?.content}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem 0" }}>
          {isLoadingReplies ? (
            <div style={{ padding: "1.5rem", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "0.82rem" }}>
              Loading replies…
            </div>
          ) : replies.length === 0 ? (
            <div style={{ padding: "1.5rem", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "0.82rem" }}>
              No replies yet
            </div>
          ) : (
            replies.map((r) => (
              <div
                key={r.id}
                style={{
                  padding: "0.75rem 1.1rem",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  gap: "0.6rem",
                  cursor: "pointer",
                }}
                onClick={() => { onClose(); navigate(`/${r.user?.username}/post/${r.id}`); }}
              >
                <Avatar
                  src={r.user?.avatar}
                  name={r.user?.display_name}
                  size={30}
                  onClick={(e) => { e.stopPropagation(); onClose(); navigate(`/${r.user?.username}`); }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: "0.4rem", alignItems: "baseline", flexWrap: "wrap" }}>
                    <span
                      style={{ fontWeight: 600, fontSize: "0.82rem", color: "#fff", cursor: "pointer" }}
                      onClick={(e) => { e.stopPropagation(); onClose(); navigate(`/${r.user?.username}`); }}
                    >
                      {r.user?.display_name}
                    </span>
                    <span
                      style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", cursor: "pointer" }}
                      onClick={(e) => { e.stopPropagation(); onClose(); navigate(`/${r.user?.username}`); }}
                    >
                      @{r.user?.username}
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.25)" }}>
                      {timeAgo(r.created_at)}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.72)", lineHeight: 1.55, marginTop: "0.2rem" }}>
                    {r.content}
                  </div>
                  {r.media && r.media.length > 0 && (
                    <div style={{ marginTop: "0.4rem" }} onClick={(e) => e.stopPropagation()}>
                      {r.media[0].type === "video" ? (
                        <video src={r.media[0].path} controls style={{ width: "100%", maxHeight: 120, borderRadius: 8, objectFit: "cover" }} />
                      ) : (
                        <img src={r.media[0].path} alt="" style={{ width: "100%", maxHeight: 120, borderRadius: 8, objectFit: "cover" }} />
                      )}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.4rem" }}>
                    <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)" }}>
                      {fmt(r.counts?.likes ?? 0)} likes · {fmt(r.counts?.replies ?? 0)} replies
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {isAuthenticated ? (
          <div
            style={{
              padding: "0.85rem 1.1rem",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              gap: "0.65rem",
              alignItems: "flex-end",
            }}
          >
            <Avatar src={myInfo?.avatar} name={myInfo?.display_name} size={32} />
            <textarea
              rows="2"
              placeholder="Reply…"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) sendComment(); }}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                padding: "0.5rem 0.75rem",
                color: "#fff",
                fontSize: "0.85rem",
                fontFamily: "'Instrument Sans', sans-serif",
                resize: "none",
                outline: "none",
                lineHeight: 1.5,
              }}
            />
            <button
              onClick={sendComment}
              disabled={!replyText.trim() || replying}
              style={{
                background: "var(--accent)",
                color: "var(--accent-text)",
                border: "none",
                borderRadius: 8,
                padding: "0.45rem 0.9rem",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'Instrument Sans', sans-serif",
                opacity: !replyText.trim() || replying ? 0.5 : 1,
                whiteSpace: "nowrap",
              }}
            >
              {replying ? "…" : "Reply"}
            </button>
          </div>
        ) : (
          <div style={{ padding: "0.85rem 1.1rem", borderTop: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
            <button
              onClick={() => navigate("/auth")}
              style={{
                background: "var(--accent)",
                color: "var(--accent-text)",
                border: "none",
                borderRadius: 8,
                padding: "0.5rem 1.2rem",
                fontSize: "0.82rem",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'Instrument Sans', sans-serif",
              }}
            >
              Log in to reply
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ReplyCard({ reply, token, myInfo, isAuthenticated, isLast }) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(reply.is_liked ?? false);
  const [likeCount, setLikeCount] = useState(reply.counts?.likes ?? 0);
  const [reposted, setReposted] = useState(reply.is_reposted ?? false);
  const [repostCount, setRepostCount] = useState(reply.counts?.reposts ?? 0);
  const { likePost, unlikePost, repostPost, unrepostPost } = usePostStore();

  const toggleLike = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => (wasLiked ? Math.max(0, c - 1) : c + 1));
    if (wasLiked) await unlikePost(reply.id, token);
    else await likePost(reply.id, token);
  };

  const toggleRepost = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) return;
    const wasReposted = reposted;
    setReposted(!wasReposted);
    setRepostCount((c) => (wasReposted ? Math.max(0, c - 1) : c + 1));
    if (wasReposted) await unrepostPost(reply.id, token);
    else await repostPost(reply.id, token);
  };

  const btnBase = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
    padding: "0.3rem 0.55rem",
    borderRadius: 7,
    border: "none",
    background: "none",
    cursor: "pointer",
    fontSize: "0.78rem",
    fontFamily: "'Instrument Sans', sans-serif",
    transition: "all 0.15s",
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "0.75rem",
        padding: "1rem 1.25rem",
        borderBottom: isLast ? "none" : "1px solid var(--border)",
        animation: "fadeUp 0.25s ease both",
        cursor: "pointer",
      }}
      onClick={() => navigate(`/${reply.user?.username}/post/${reply.id}`)}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0, flexShrink: 0 }}>
        <Avatar
          src={reply.user?.avatar}
          name={reply.user?.display_name}
          size={38}
          onClick={(e) => { e.stopPropagation(); navigate(`/${reply.user?.username}`); }}
        />
        {!isLast && (
          <div style={{ width: 1, flex: 1, background: "var(--border)", marginTop: 4, minHeight: 16 }} />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.3rem", flexWrap: "wrap" }}>
          <span
            style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text)", cursor: "pointer" }}
            onClick={(e) => { e.stopPropagation(); navigate(`/${reply.user?.username}`); }}
          >
            {reply.user?.display_name}
          </span>
          <span
            style={{ color: "var(--text3)", fontSize: "0.8rem", cursor: "pointer" }}
            onClick={(e) => { e.stopPropagation(); navigate(`/${reply.user?.username}`); }}
          >
            @{reply.user?.username}
          </span>
          <span style={{ color: "var(--text3)", fontSize: "0.78rem" }}>· {timeAgo(reply.created_at)}</span>
        </div>

        <div style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "var(--text)", marginBottom: "0.6rem" }}>
          {reply.content}
        </div>

        {reply.media && reply.media.length > 0 && (
          <div style={{ marginBottom: "0.5rem" }} onClick={(e) => e.stopPropagation()}>
            <ReplyMediaGrid media={reply.media} />
          </div>
        )}

        <div style={{ display: "flex", gap: "0.1rem" }} onClick={(e) => e.stopPropagation()}>
          <button
            style={{ ...btnBase, color: liked ? "var(--red)" : "var(--text3)" }}
            onClick={toggleLike}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {likeCount > 0 && <span>{fmt(likeCount)}</span>}
          </button>

          <button
            style={{ ...btnBase, color: "var(--text3)" }}
            onClick={(e) => { e.stopPropagation(); navigate(`/${reply.user?.username}/post/${reply.id}`); }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {(reply.counts?.replies ?? 0) > 0 && <span>{fmt(reply.counts.replies)}</span>}
          </button>

          <button
            style={{ ...btnBase, color: reposted ? "var(--accent)" : "var(--text3)", opacity: isAuthenticated ? 1 : 0.5 }}
            onClick={toggleRepost}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
            {repostCount > 0 && <span>{fmt(repostCount)}</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

const PostDetails = () => {
  const navigate = useNavigate();
  const { username, id } = useParams();
  const { token, isAuthenticated, me } = useAuthStore();
  const myInfo = me ?? null;

  const {
    currentPost,
    parentPost,
    replies,
    isLoadingPost,
    isLoadingReplies,
    postError,
    fetchPost,
    fetchReplies,
    likePost,
    unlikePost,
    repostPost,
    unrepostPost,
    createReply,
    uploadMedia,
    clearPost,
  } = usePostStore();

  const {
    profiles,
    fetchProfile,
    isFollowing,
    isFollowLoading,
    followUser,
    unfollowUser,
  } = useProfileStore();

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [reposted, setReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(0);
  const [replyCount, setReplyCount] = useState(0);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [repliesPage, setRepliesPage] = useState(1);
  const [repliesLastPage, setRepliesLastPage] = useState(1);
  const [replyMediaItems, setReplyMediaItems] = useState([]);
  const replyRef = useRef(null);
  const mediaInputRef = useRef(null);

  const postUsername = currentPost?.user?.username ?? username;
  const profileData = profiles[postUsername] ?? null;
  const isMyPost = me?.username === postUsername;

  useEffect(() => {
    if (id) {
      fetchPost(id, token);
      fetchReplies(id, token, 1).then((meta) => {
        if (meta?.last_page) setRepliesLastPage(meta.last_page);
      });
    }
    return () => clearPost();
  }, [id]);

  useEffect(() => {
    if (currentPost) {
      setLiked(currentPost.is_liked ?? false);
      setLikeCount(currentPost.counts?.likes ?? 0);
      setReposted(currentPost.is_reposted ?? false);
      setRepostCount(currentPost.counts?.reposts ?? 0);
      setReplyCount(currentPost.counts?.replies ?? 0);
      const u = currentPost.user?.username;
      if (u && !profiles[u]) fetchProfile(u, token);
    }
  }, [currentPost]);

  const loadMoreReplies = useCallback(async () => {
    if (isLoadingReplies || repliesPage >= repliesLastPage) return;
    const next = repliesPage + 1;
    setRepliesPage(next);
    const meta = await fetchReplies(id, token, next);
    if (meta?.last_page) setRepliesLastPage(meta.last_page);
  }, [isLoadingReplies, repliesPage, repliesLastPage, id, token]);

  useEffect(() => {
    const handleScroll = () => {
      const nearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 300;
      if (nearBottom) loadMoreReplies();
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadMoreReplies]);

  const toggleLike = async () => {
    if (!isAuthenticated) { navigate("/auth"); return; }
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => (wasLiked ? Math.max(0, c - 1) : c + 1));
    if (wasLiked) await unlikePost(currentPost.id, token);
    else await likePost(currentPost.id, token);
  };

  const toggleRepost = async () => {
    if (!isAuthenticated) { navigate("/auth"); return; }
    const wasReposted = reposted;
    setReposted(!wasReposted);
    setRepostCount((c) => (wasReposted ? Math.max(0, c - 1) : c + 1));
    if (wasReposted) await unrepostPost(currentPost.id, token);
    else await repostPost(currentPost.id, token);
  };

  const handleFollow = () => {
    if (!isAuthenticated) { navigate("/auth"); return; }
    if (isFollowing) unfollowUser(postUsername, token);
    else followUser(postUsername, token);
  };

  const focusReply = () => {
    replyRef.current?.focus();
    replyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleMediaSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = 4 - replyMediaItems.length;
    const toProcess = files.slice(0, remaining);

    const newItems = toProcess.map((file) => ({
      localUrl: URL.createObjectURL(file),
      type: file.type.startsWith("video") ? "video" : "image",
      uploading: true,
      url: null,
      uploadType: null,
    }));

    setReplyMediaItems((prev) => [...prev, ...newItems]);
    e.target.value = "";

    const startIndex = replyMediaItems.length;
    await Promise.all(
      toProcess.map(async (file, i) => {
        const result = await uploadMedia(file, token);
        setReplyMediaItems((prev) => {
          const updated = [...prev];
          const idx = startIndex + i;
          if (updated[idx]) {
            updated[idx] = {
              ...updated[idx],
              uploading: false,
              url: result.error ? null : result.url,
              uploadType: result.error ? null : result.type,
            };
          }
          return updated;
        });
      })
    );
  };

  const removeReplyMedia = (index) => {
    setReplyMediaItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      if (item?.localUrl) URL.revokeObjectURL(item.localUrl);
      updated.splice(index, 1);
      return updated;
    });
  };

  const sendReply = async (textOverride) => {
    const content = textOverride ?? replyText;
    if (!content.trim() || replying) return;
    if (!isAuthenticated) { navigate("/auth"); return; }

    const stillUploading = replyMediaItems.some((m) => m.uploading);
    if (stillUploading) return;

    const mediaPayload = replyMediaItems
      .filter((m) => m.url)
      .map((m) => ({ url: m.url, type: m.uploadType ?? m.type }));

    setReplying(true);
    const result = await createReply(currentPost.id, content, token, mediaPayload);
    if (!result?.error) {
      if (!textOverride) setReplyText("");
      setReplyMediaItems([]);
      setReplyCount((c) => c + 1);
    }
    setReplying(false);
    return result;
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
  };

  const post = currentPost;
  const fullDate = post?.created_at
    ? new Date(post.created_at).toLocaleString("en-NG", {
        hour: "numeric",
        minute: "2-digit",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const actBtnStyle = (active = false) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.5rem 0.9rem",
    borderRadius: 9,
    border: "none",
    background: "none",
    cursor: "pointer",
    fontSize: "0.82rem",
    fontWeight: 500,
    fontFamily: "'Instrument Sans', sans-serif",
    transition: "all 0.15s",
    color: active ? "var(--accent)" : "var(--text3)",
  });

  const stillUploading = replyMediaItems.some((m) => m.uploading);

  return (
    <>
      <style>{`
        @keyframes skelPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {lightboxIndex !== null && post?.media?.length > 0 && (
        <Lightbox
          media={post.media}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          post={post}
          token={token}
          myInfo={myInfo}
          isAuthenticated={isAuthenticated}
          postId={id}
          replies={replies}
          isLoadingReplies={isLoadingReplies}
          onSendReply={sendReply}
        />
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.85rem 1.25rem",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text)",
            padding: "0.3rem",
            borderRadius: 7,
            display: "flex",
            alignItems: "center",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span style={{ fontWeight: 700, fontSize: "1rem" }}>Post</span>
      </div>

      {isLoadingPost ? (
        <PostSkeleton />
      ) : postError ? (
        <div style={{ padding: "3rem 1.5rem", textAlign: "center", color: "var(--text3)" }}>
          {postError}
        </div>
      ) : post ? (
        <div style={{ borderBottom: "1px solid var(--border)" }}>
          {parentPost && (
            <div
              style={{
                padding: "0.9rem 1.25rem",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                gap: "0.75rem",
                cursor: "pointer",
                opacity: 0.75,
              }}
              onClick={() => navigate(`/${parentPost.user?.username}/post/${parentPost.id}`)}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Avatar
                  src={parentPost.user?.avatar}
                  name={parentPost.user?.display_name}
                  size={34}
                  onClick={(e) => { e.stopPropagation(); navigate(`/${parentPost.user?.username}`); }}
                />
                <div style={{ width: 1, flex: 1, background: "var(--border)", marginTop: 4, minHeight: 20 }} />
              </div>
              <div style={{ flex: 1, minWidth: 0, paddingBottom: "0.5rem" }}>
                <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", marginBottom: "0.25rem" }}>
                  <span
                    style={{ fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}
                    onClick={(e) => { e.stopPropagation(); navigate(`/${parentPost.user?.username}`); }}
                  >
                    {parentPost.user?.display_name}
                  </span>
                  <span
                    style={{ color: "var(--text3)", fontSize: "0.78rem", cursor: "pointer" }}
                    onClick={(e) => { e.stopPropagation(); navigate(`/${parentPost.user?.username}`); }}
                  >
                    @{parentPost.user?.username}
                  </span>
                  <span style={{ color: "var(--text3)", fontSize: "0.75rem" }}>· {timeAgo(parentPost.created_at)}</span>
                </div>
                <div style={{ fontSize: "0.88rem", color: "var(--text2)", lineHeight: 1.55 }}>
                  {parentPost.content}
                </div>
                {parentPost.media && parentPost.media.length > 0 && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <ReplyMediaGrid media={parentPost.media} />
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ padding: "1.4rem 1.25rem 0" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem", marginBottom: "1rem" }}>
              <Avatar
                src={post.user?.avatar}
                name={post.user?.display_name}
                size={44}
                onClick={() => navigate(`/${post.user?.username}`)}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{ fontWeight: 700, fontSize: "0.95rem", lineHeight: 1.2, cursor: "pointer" }}
                  onClick={() => navigate(`/${post.user?.username}`)}
                >
                  {post.user?.display_name}
                </div>
                <div
                  style={{ color: "var(--text3)", fontSize: "0.82rem", cursor: "pointer" }}
                  onClick={() => navigate(`/${post.user?.username}`)}
                >
                  @{post.user?.username}
                </div>
              </div>
              {!isMyPost && isAuthenticated && (
                <button
                  onClick={handleFollow}
                  disabled={isFollowLoading}
                  style={{
                    padding: "0.38rem 1rem",
                    borderRadius: 20,
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    fontFamily: "'Instrument Sans', sans-serif",
                    cursor: "pointer",
                    border: isFollowing ? "1.5px solid var(--border2)" : "none",
                    background: isFollowing ? "transparent" : "var(--accent)",
                    color: isFollowing ? "var(--text2)" : "var(--accent-text)",
                    opacity: isFollowLoading ? 0.6 : 1,
                  }}
                >
                  {isFollowLoading ? "…" : isFollowing ? "Following" : "Follow"}
                </button>
              )}
              {!isMyPost && !isAuthenticated && (
                <button
                  onClick={() => navigate("/auth")}
                  style={{
                    padding: "0.38rem 1rem",
                    borderRadius: 20,
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    fontFamily: "'Instrument Sans', sans-serif",
                    cursor: "pointer",
                    border: "none",
                    background: "var(--accent)",
                    color: "var(--accent-text)",
                  }}
                >
                  Follow
                </button>
              )}
            </div>

            <div
              style={{
                fontSize: "1.15rem",
                lineHeight: 1.65,
                color: "var(--text)",
                whiteSpace: "pre-line",
                marginBottom: "1rem",
                letterSpacing: "-0.01em",
              }}
            >
              {post.content}
            </div>

            {post.media && post.media.length > 0 && (
              <MediaGrid media={post.media} onOpenLightbox={(index) => setLightboxIndex(index)} />
            )}

            <div
              style={{
                fontSize: "0.82rem",
                color: "var(--text3)",
                padding: "0.85rem 0",
                borderTop: "1px solid var(--border)",
                borderBottom: "1px solid var(--border)",
                marginBottom: "0.1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {fullDate}
            </div>

            <div style={{ display: "flex", gap: "1.5rem", padding: "0.9rem 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: "0.875rem", color: "var(--text2)" }}>
                <strong style={{ color: "var(--text)", fontWeight: 700 }}>{fmt(repostCount)}</strong> Reposts
              </div>
              <div style={{ fontSize: "0.875rem", color: "var(--text2)" }}>
                <strong style={{ color: "var(--text)", fontWeight: 700 }}>{fmt(likeCount)}</strong> Likes
              </div>
              <div style={{ fontSize: "0.875rem", color: "var(--text2)" }}>
                <strong style={{ color: "var(--text)", fontWeight: 700 }}>{fmt(replyCount)}</strong> Replies
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-around",
                padding: "0.3rem 0 0.5rem",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <button style={actBtnStyle()} onClick={focusReply}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Reply
              </button>
              <button style={actBtnStyle(reposted)} onClick={toggleRepost}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polyline points="17 1 21 5 17 9" />
                  <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <polyline points="7 23 3 19 7 15" />
                  <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
                {reposted ? "Reposted" : "Repost"}
              </button>
              <button
                style={{ ...actBtnStyle(liked), color: liked ? "var(--red)" : "var(--text3)" }}
                onClick={toggleLike}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {liked ? "Liked" : "Like"}
              </button>
              <button style={actBtnStyle()} onClick={copyLink}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                Share
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isAuthenticated ? (
        <div
          style={{
            padding: "1rem 1.25rem",
            borderBottom: "1px solid var(--border)",
            background: "var(--surface)",
          }}
        >
          <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
            <Avatar src={myInfo?.avatar} name={myInfo?.display_name} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <textarea
                ref={replyRef}
                rows="2"
                placeholder="Write your reply…"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) sendReply(); }}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontFamily: "'Instrument Sans', sans-serif",
                  fontSize: "0.92rem",
                  color: "var(--text)",
                  resize: "none",
                  lineHeight: 1.5,
                  paddingTop: "0.2rem",
                  boxSizing: "border-box",
                }}
              />
              {replyMediaItems.length > 0 && (
                <MediaPreview items={replyMediaItems} onRemove={removeReplyMedia} />
              )}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.5rem" }}>
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  {replyMediaItems.length < 4 && (
                    <>
                      <input
                        ref={mediaInputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        style={{ display: "none" }}
                        onChange={handleMediaSelect}
                      />
                      <button
                        onClick={() => mediaInputRef.current?.click()}
                        title="Add image or video"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--accent)",
                          padding: "0.3rem",
                          borderRadius: 6,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
                <button
                  onClick={() => sendReply()}
                  disabled={(!replyText.trim() && replyMediaItems.length === 0) || replying || stillUploading}
                  style={{
                    background: "var(--accent)",
                    color: "var(--accent-text)",
                    border: "none",
                    borderRadius: 8,
                    padding: "0.42rem 1rem",
                    fontFamily: "'Instrument Sans', sans-serif",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    opacity: ((!replyText.trim() && replyMediaItems.length === 0) || replying || stillUploading) ? 0.5 : 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  {replying ? "Replying…" : stillUploading ? "Uploading…" : "Reply"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            padding: "1rem 1.25rem",
            borderBottom: "1px solid var(--border)",
            background: "var(--surface)",
          }}
        >
          <span style={{ fontSize: "0.875rem", color: "var(--text3)" }}>Log in to reply</span>
          <button
            onClick={() => navigate("/auth")}
            className="post-btn-sm"
            style={{ padding: "0.42rem 1.1rem", fontSize: "0.82rem" }}
          >
            Log in
          </button>
        </div>
      )}

      <div
        style={{
          padding: "0.85rem 1.25rem 0.5rem",
          fontSize: "0.78rem",
          fontWeight: 600,
          color: "var(--text3)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        {isLoadingReplies
          ? "Loading…"
          : `${replies.length} ${replies.length === 1 ? "Reply" : "Replies"}`}
      </div>

      {isLoadingReplies && replies.length === 0 ? (
        [1, 2, 3].map((k) => <ReplySkeleton key={k} />)
      ) : replies.length === 0 ? (
        <div style={{ padding: "2.5rem 1.5rem", textAlign: "center", color: "var(--text3)", fontSize: "0.875rem" }}>
          No replies yet. Be the first!
        </div>
      ) : (
        <>
          {replies.map((reply, i) => (
            <ReplyCard
              key={reply.id}
              reply={reply}
              token={token}
              myInfo={myInfo}
              isAuthenticated={isAuthenticated}
              isLast={i === replies.length - 1}
            />
          ))}
          {isLoadingReplies && (
            <div style={{ display: "flex", justifyContent: "center", padding: "1rem" }}>
              <div
                style={{
                  width: 20,
                  height: 20,
                  border: "2px solid var(--border2)",
                  borderTopColor: "var(--accent)",
                  borderRadius: "50%",
                  animation: "spin 0.7s linear infinite",
                }}
              />
            </div>
          )}
        </>
      )}
    </>
  );
};

export default PostDetails;