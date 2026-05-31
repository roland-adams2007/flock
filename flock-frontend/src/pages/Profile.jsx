import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore, useProfileStore, usePostStore } from "../store/store";

function fmt(n) {
  if (!n && n !== 0) return "0";
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000)
    return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "K";
  return n;
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
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
    >
      {getInitials(name)}
    </div>
  );
}

function AvatarLightbox({ src, name, onClose }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          background: "rgba(0,0,0,0.5)",
          border: "none",
          borderRadius: "50%",
          width: 36,
          height: 36,
          color: "#fff",
          fontSize: "1rem",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ✕
      </button>
      {src ? (
        <img
          src={src}
          alt={name}
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: "90vw",
            maxHeight: "90vh",
            borderRadius: 12,
            objectFit: "contain",
            boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
          }}
        />
      ) : (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "var(--surface2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "4rem",
            fontWeight: 700,
            color: "var(--text2)",
          }}
        >
          {getInitials(name)}
        </div>
      )}
    </div>
  );
}

function SkeletonBlock({ w, h }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        background: "var(--surface2)",
        borderRadius: 6,
        animation: "pulse 1.4s ease-in-out infinite",
      }}
    />
  );
}

function SkeletonPost() {
  return (
    <div className="post-card">
      <div style={{ display: "flex", gap: "0.85rem" }}>
        <div
          style={{
            width: 38,
            height: 38,
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
            gap: "0.5rem",
          }}
        >
          <SkeletonBlock w="40%" h={12} />
          <SkeletonBlock w="90%" h={12} />
          <SkeletonBlock w="70%" h={12} />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div
      style={{
        padding: "3rem 1.5rem",
        textAlign: "center",
        color: "var(--text3)",
        fontSize: "0.875rem",
      }}
    >
      No {label} yet
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          border: "2.5px solid var(--border2)",
          borderTopColor: "var(--accent)",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function PostMediaGrid({ media, onStopProp }) {
  if (!media || media.length === 0) return null;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: media.length === 1 ? "1fr" : "1fr 1fr",
        gap: "0.4rem",
        marginTop: "0.65rem",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      {media.map((m) =>
        m.type === "video" ? (
          <video
            key={m.id}
            src={m.path}
            controls
            style={{
              width: "100%",
              borderRadius: "10px",
              maxHeight: 280,
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <img
            key={m.id}
            src={m.path}
            alt=""
            style={{
              width: "100%",
              objectFit: "cover",
              maxHeight: 280,
              borderRadius: media.length === 1 ? "12px" : "6px",
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ),
      )}
    </div>
  );
}

function CommentModal({ post, token, myInfo, onClose, onCommentPosted }) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { createReply } = usePostStore();

  const submit = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    await createReply(post.id, text, token);
    onCommentPosted && onCommentPosted();
    setText("");
    setSubmitting(false);
    onClose();
  };

  return (
    <div
      className="modal-bg open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box">
        <div className="modal-head">
          <div className="serif" style={{ fontSize: "1.1rem" }}>
            Reply
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.75rem",
            background: "var(--surface2)",
            borderRadius: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "0.65rem",
              alignItems: "flex-start",
            }}
          >
            <Avatar
              src={post.user?.avatar}
              name={post.user?.display_name}
              size={32}
            />
            <div>
              <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                {post.user?.display_name}
              </span>
              <span
                style={{
                  color: "var(--text3)",
                  fontSize: "0.8rem",
                  marginLeft: "0.4rem",
                }}
              >
                @{post.user?.username}
              </span>
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "var(--text2)",
                  marginTop: "0.3rem",
                }}
              >
                {post.content}
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.85rem" }}>
          <Avatar src={myInfo?.avatar} name={myInfo?.display_name} size={36} />
          <div style={{ flex: 1 }}>
            <textarea
              rows="3"
              className="compose-textarea"
              placeholder="Post your reply…"
              style={{ width: "100%", fontSize: "0.95rem" }}
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoFocus
            />
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "0.65rem",
              }}
            >
              <button
                className="post-btn-sm"
                onClick={submit}
                disabled={!text.trim() || submitting}
                style={{
                  padding: "0.5rem 1.4rem",
                  fontSize: "0.875rem",
                  opacity: !text.trim() || submitting ? 0.5 : 1,
                }}
              >
                {submitting ? "Replying…" : "Reply"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PostCard({
  post,
  isReply,
  token,
  myInfo,
  myUsername,
  onDeleted,
  onEdited,
  repostedByUsername,
}) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(post.is_liked ?? post._liked ?? false);
  const [likeCount, setLikeCount] = useState(post?.counts?.likes ?? 0);
  const [reposted, setReposted] = useState(
    post.is_reposted ?? post._reposted ?? false,
  );
  const [repostCount, setRepostCount] = useState(post?.counts?.reposts ?? 0);
  const [commentCount, setCommentCount] = useState(post?.counts?.replies ?? 0);
  const [showMenu, setShowMenu] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editText, setEditText] = useState(post.content ?? "");
  const [commentOpen, setCommentOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const menuRef = useRef(null);

  const {
    likePost,
    unlikePost,
    repostPost,
    unrepostPost,
    deletePost,
    editPost,
  } = usePostStore();

  const isMyPost = myUsername && post.user?.username === myUsername;

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleLike = async (e) => {
    e.stopPropagation();
    if (!token) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => (wasLiked ? c - 1 : c + 1));
    if (wasLiked) await unlikePost(post.id, token);
    else await likePost(post.id, token);
  };

  const toggleRepost = async (e) => {
    e.stopPropagation();
    if (!token) return;
    const wasReposted = reposted;
    setReposted(!wasReposted);
    setRepostCount((c) => (wasReposted ? Math.max(0, c - 1) : c + 1));
    if (wasReposted) await unrepostPost(post.id, token);
    else await repostPost(post.id, token);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this post?")) return;
    setDeleting(true);
    await deletePost(post.id, token);
    onDeleted && onDeleted(post.id);
  };

  const handleEdit = async () => {
    if (!editText.trim() || editSaving) return;
    setEditSaving(true);
    await editPost(post.id, editText, token);
    onEdited && onEdited(post.id, editText);
    setEditSaving(false);
    setEditOpen(false);
  };

  const handleCardClick = () => {
    navigate(`/${post.user?.username}/post/${post.id}`);
  };

  const user = post.user;

  const showRepostBanner = post.is_repost === true && repostedByUsername;

  return (
    <>
      <div
        className="post-card"
        style={{
          opacity: deleting ? 0.4 : 1,
          transition: "opacity 0.2s",
          cursor: "pointer",
        }}
        onClick={handleCardClick}
      >
        {showRepostBanner && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: "0.75rem",
              color: "var(--text3)",
              marginBottom: "0.5rem",
              paddingLeft: "0.25rem",
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
            <span>
              {repostedByUsername === myUsername
                ? "You reposted"
                : `@${repostedByUsername} reposted`}
            </span>
          </div>
        )}

        <div style={{ display: "flex", gap: "0.85rem" }}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/${user?.username}`);
            }}
          >
            <Avatar src={user?.avatar} name={user?.display_name} size={38} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div className="post-meta">
                <span
                  className="post-name"
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/${user?.username}`);
                  }}
                >
                  {user?.display_name}
                </span>
                <span
                  className="post-handle"
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/${user?.username}`);
                  }}
                >
                  @{user?.username}
                </span>
                <span className="post-time">
                  {post.created_at
                    ? new Date(post.created_at).toLocaleDateString("en-NG", {
                        month: "short",
                        day: "numeric",
                      })
                    : ""}
                </span>
              </div>
              {isMyPost && (
                <div
                  style={{ position: "relative" }}
                  ref={menuRef}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setShowMenu((v) => !v)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text3)",
                      padding: "0.2rem 0.4rem",
                      borderRadius: 6,
                    }}
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <circle cx="12" cy="5" r="1.5" />
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="12" cy="19" r="1.5" />
                    </svg>
                  </button>
                  {showMenu && (
                    <div
                      style={{
                        position: "absolute",
                        right: 0,
                        top: "100%",
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        minWidth: 130,
                        zIndex: 50,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                        overflow: "hidden",
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditOpen(true);
                          setShowMenu(false);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          width: "100%",
                          padding: "0.65rem 1rem",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "0.85rem",
                          color: "var(--text)",
                        }}
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Edit post
                      </button>
                      <button
                        onClick={handleDelete}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          width: "100%",
                          padding: "0.65rem 1rem",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "0.85rem",
                          color: "var(--red, #f87171)",
                        }}
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {isReply && post.reply_to && (
              <div
                style={{
                  fontSize: "0.78rem",
                  color: "var(--text3)",
                  marginBottom: "0.45rem",
                }}
              >
                ↩ Replying to{" "}
                <span
                  style={{ color: "var(--accent)", cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/${post.reply_to.user?.username}`);
                  }}
                >
                  @{post.reply_to.user?.username}
                </span>
              </div>
            )}

            <div className="post-text">{post.content}</div>

            {post.media && post.media.length > 0 && (
              <PostMediaGrid media={post.media} />
            )}

            <div className="actions" onClick={(e) => e.stopPropagation()}>
              <button
                className={`act${liked ? " liked" : ""}`}
                onClick={toggleLike}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill={liked ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {fmt(likeCount)}
              </button>
              <button
                className="act"
                onClick={(e) => {
                  e.stopPropagation();
                  token && setCommentOpen(true);
                }}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {fmt(commentCount)}
              </button>
              <button
                className={`act${reposted ? " liked" : ""}`}
                onClick={toggleRepost}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <polyline points="17 1 21 5 17 9" />
                  <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <polyline points="7 23 3 19 7 15" />
                  <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
                {fmt(repostCount)}
              </button>
              <button className="act">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {editOpen && (
        <div
          className="modal-bg open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditOpen(false);
          }}
        >
          <div className="modal-box">
            <div className="modal-head">
              <div className="serif" style={{ fontSize: "1.1rem" }}>
                Edit Post
              </div>
              <button className="close-btn" onClick={() => setEditOpen(false)}>
                ✕
              </button>
            </div>
            <textarea
              rows="5"
              className="compose-textarea"
              style={{ width: "100%", fontSize: "0.95rem" }}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              autoFocus
            />
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "0.75rem",
                gap: "0.6rem",
              }}
            >
              <button
                onClick={() => setEditOpen(false)}
                style={{
                  background: "transparent",
                  border: "1.5px solid var(--border2)",
                  borderRadius: 9,
                  padding: "0.5rem 1.1rem",
                  fontFamily: "'Instrument Sans', sans-serif",
                  fontSize: "0.875rem",
                  color: "var(--text2)",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={!editText.trim() || editSaving}
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-text)",
                  border: "none",
                  borderRadius: 9,
                  padding: "0.5rem 1.4rem",
                  fontFamily: "'Instrument Sans', sans-serif",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  opacity: !editText.trim() || editSaving ? 0.5 : 1,
                }}
              >
                {editSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {commentOpen && (
        <CommentModal
          post={post}
          token={token}
          myInfo={myInfo}
          onClose={() => setCommentOpen(false)}
          onCommentPosted={() => setCommentCount((c) => c + 1)}
        />
      )}
    </>
  );
}

function ReplyCard({ post, token, myInfo, myUsername, onDeleted }) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(post.is_liked ?? false);
  const [likeCount, setLikeCount] = useState(post?.counts?.likes ?? 0);
  const [commentCount] = useState(post?.counts?.replies ?? 0);
  const { likePost, unlikePost } = usePostStore();

  const toggleLike = async (e) => {
    e.stopPropagation();
    if (!token) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => (wasLiked ? Math.max(0, c - 1) : c + 1));
    if (wasLiked) await unlikePost(post.id, token);
    else await likePost(post.id, token);
  };

  const user = post.user;

  return (
    <div
      className="post-card"
      style={{ cursor: "pointer" }}
      onClick={() => navigate(`/${user?.username}/post/${post.id}`)}
    >
      {post.reply_to && (
        <div
          style={{
            marginBottom: "0.6rem",
            padding: "0.6rem 0.75rem",
            background: "var(--surface2)",
            borderRadius: 10,
            borderLeft: "2px solid var(--border2)",
          }}
          onClick={(e) => {
            e.stopPropagation();
            navigate(
              `/${post.reply_to.user?.username}/post/${post.reply_to.id}`,
            );
          }}
        >
          <div
            style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}
          >
            <Avatar
              src={post.reply_to.user?.avatar}
              name={post.reply_to.user?.display_name}
              size={22}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/${post.reply_to.user?.username}`);
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  gap: "0.35rem",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: "0.78rem",
                    color: "var(--text)",
                    cursor: "pointer",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/${post.reply_to.user?.username}`);
                  }}
                >
                  {post.reply_to.user?.display_name}
                </span>
                <span
                  style={{
                    color: "var(--text3)",
                    fontSize: "0.74rem",
                    cursor: "pointer",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/${post.reply_to.user?.username}`);
                  }}
                >
                  @{post.reply_to.user?.username}
                </span>
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text2)",
                  lineHeight: 1.4,
                  marginTop: "0.15rem",
                }}
              >
                {post.reply_to.content?.slice(0, 120)}
                {post.reply_to.content?.length > 120 ? "…" : ""}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "0.85rem" }}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/${user?.username}`);
          }}
        >
          <Avatar src={user?.avatar} name={user?.display_name} size={38} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="post-meta">
            <span
              className="post-name"
              style={{ cursor: "pointer" }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/${user?.username}`);
              }}
            >
              {user?.display_name}
            </span>
            <span
              className="post-handle"
              style={{ cursor: "pointer" }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/${user?.username}`);
              }}
            >
              @{user?.username}
            </span>
            <span className="post-time">
              {post.created_at
                ? new Date(post.created_at).toLocaleDateString("en-NG", {
                    month: "short",
                    day: "numeric",
                  })
                : ""}
            </span>
          </div>

          <div className="post-text">{post.content}</div>

          {post.media && post.media.length > 0 && (
            <PostMediaGrid media={post.media} />
          )}

          <div className="actions" onClick={(e) => e.stopPropagation()}>
            <button
              className={`act${liked ? " liked" : ""}`}
              onClick={toggleLike}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill={liked ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {fmt(likeCount)}
            </button>
            <button
              className="act"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/${user?.username}/post/${post.id}`);
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {fmt(commentCount)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComposePost({ myInfo, token, username, onPosted }) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const { createPost, uploadMedia } = usePostStore();

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const limited = files.slice(0, 4 - mediaFiles.length);
    setMediaFiles((prev) => [...prev, ...limited]);
    limited.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setMediaPreviews((prev) => [
          ...prev,
          {
            url: ev.target.result,
            type: f.type.startsWith("video") ? "video" : "image",
          },
        ]);
      reader.readAsDataURL(f);
    });
    e.target.value = "";
  };

  const removeMedia = (i) => {
    setMediaFiles((prev) => prev.filter((_, idx) => idx !== i));
    setMediaPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const submit = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    let mediaUrls = [];
    if (mediaFiles.length) {
      setUploading(true);
      const results = await Promise.all(
        mediaFiles.map((f) => uploadMedia(f, token)),
      );
      setUploading(false);
      mediaUrls = results
        .filter((r) => r && !r.error)
        .map((r) => ({ url: r.url, type: r.type }));
    }
    const result = await createPost(text, token, username, mediaUrls);
    if (!result?.error) {
      setText("");
      setMediaFiles([]);
      setMediaPreviews([]);
      onPosted && onPosted();
    }
    setSubmitting(false);
  };

  return (
    <div
      className="post-card"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <div style={{ display: "flex", gap: "0.85rem" }}>
        <Avatar src={myInfo?.avatar} name={myInfo?.display_name} size={38} />
        <div style={{ flex: 1 }}>
          <textarea
            rows="2"
            className="compose-textarea"
            placeholder="What's happening?"
            style={{ width: "100%", fontSize: "0.95rem", minHeight: 70 }}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {mediaPreviews.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  mediaPreviews.length === 1 ? "1fr" : "1fr 1fr",
                gap: "0.4rem",
                marginTop: "0.5rem",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              {mediaPreviews.map((m, i) => (
                <div key={i} style={{ position: "relative" }}>
                  {m.type === "video" ? (
                    <video
                      src={m.url}
                      style={{
                        width: "100%",
                        maxHeight: 200,
                        objectFit: "cover",
                        borderRadius: 8,
                      }}
                    />
                  ) : (
                    <img
                      src={m.url}
                      loading="lazy"
                      alt=""
                      style={{
                        width: "100%",
                        maxHeight: 200,
                        objectFit: "cover",
                        borderRadius: 8,
                      }}
                    />
                  )}
                  <button
                    onClick={() => removeMedia(i)}
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      background: "rgba(0,0,0,0.6)",
                      border: "none",
                      borderRadius: "50%",
                      width: 22,
                      height: 22,
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "0.6rem",
            }}
          >
            <button
              className="icon-btn"
              onClick={() => fileRef.current?.click()}
              disabled={mediaFiles.length >= 4}
            >
              <svg
                width="17"
                height="17"
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
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              multiple
              style={{ display: "none" }}
              onChange={handleFileSelect}
            />
            <button
              className="post-btn-sm"
              onClick={submit}
              disabled={!text.trim() || submitting}
              style={{
                padding: "0.45rem 1.3rem",
                fontSize: "0.85rem",
                opacity: !text.trim() || submitting ? 0.5 : 1,
              }}
            >
              {uploading ? "Uploading…" : submitting ? "Posting…" : "Post it"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonProfile() {
  return (
    <>
      <div className="profile-header-bar">
        <div
          style={{
            width: 120,
            height: 14,
            background: "var(--surface2)",
            borderRadius: 6,
            animation: "pulse 1.4s ease-in-out infinite",
          }}
        />
      </div>
      <div
        className="cover"
        style={{
          background: "var(--surface2)",
          animation: "pulse 1.4s ease-in-out infinite",
        }}
      />
      <div className="profile-info-section" style={{ paddingTop: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            paddingTop: "0.75rem",
            marginBottom: "2.5rem",
          }}
        >
          <div
            style={{
              width: 100,
              height: 34,
              background: "var(--surface2)",
              borderRadius: 20,
              animation: "pulse 1.4s ease-in-out infinite",
            }}
          />
        </div>
        <div className="profile-avatar-wrap">
          <div
            className="profile-avatar"
            style={{
              background: "var(--surface2)",
              animation: "pulse 1.4s ease-in-out infinite",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            marginTop: "0.5rem",
          }}
        >
          <SkeletonBlock w={140} h={16} />
          <SkeletonBlock w={90} h={12} />
          <SkeletonBlock w="80%" h={12} />
        </div>
        <div style={{ display: "flex", gap: "1.5rem", marginTop: "1rem" }}>
          <SkeletonBlock w={80} h={32} />
          <SkeletonBlock w={80} h={32} />
        </div>
      </div>
    </>
  );
}

const Profile = () => {
  const navigate = useNavigate();
  const { username } = useParams();
  const { token, isAuthenticated } = useAuthStore();

  const {
    profiles,
    isLoadingProfile,
    isLoadingPosts,
    isLoadingReplies,
    isLoadingLikedPosts,
    isLoadingReposts,
    error,
    fetchProfile,
    fetchPosts,
    fetchReplies,
    fetchLikedPosts,
    fetchReposts,
    followUser,
    unfollowUser,
    clearProfile,
    updateProfile,
    uploadAvatar,
    isFollowing,
    isFollowLoading,
  } = useProfileStore();

  const { me } = useAuthStore();
  const myUsername = me?.username ?? null;
  const myInfo = me ?? null;

  const [activeTab, setActiveTab] = useState("posts");
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: "",
    bio: "",
    website: "",
    avatar: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [localPosts, setLocalPosts] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const [postsPage, setPostsPage] = useState(1);
  const [repliesPage, setRepliesPage] = useState(1);
  const [likesPage, setLikesPage] = useState(1);
  const [repostsPage, setRepostsPage] = useState(1);

  const avatarInputRef = useRef(null);

  const profileData = profiles[username] ?? null;
  const info = profileData?.info ?? null;
  const isMine = profileData?.mine ?? false;

  const postsLastPage = profileData?.posts?.last_page ?? 1;
  const repliesLastPage = profileData?.replies?.last_page ?? 1;
  const likesLastPage = profileData?.likedPosts?.last_page ?? 1;
  const repostsLastPage = profileData?.reposts?.last_page ?? 1;

  useEffect(() => {
    if (username) fetchProfile(username, token);
    return () => clearProfile();
  }, [username]);

  useEffect(() => {
    if (info) {
      setEditForm({
        display_name: info.display_name ?? "",
        bio: info.bio ?? "",
        website: info.website ?? "",
        avatar: info.avatar ?? "",
      });
    }
  }, [info]);

  useEffect(() => {
    if (!username || !profileData) return;
    if (activeTab === "posts" && !profileData.posts) {
      setPostsPage(1);
      fetchPosts(username, token, 1);
    }
    if (activeTab === "replies" && !profileData.replies) {
      setRepliesPage(1);
      fetchReplies(username, token, 1);
    }
    if (activeTab === "likes" && !profileData.likedPosts) {
      setLikesPage(1);
      fetchLikedPosts(username, token, 1);
    }
    if (activeTab === "reposts" && !profileData.reposts) {
      setRepostsPage(1);
      fetchReposts(username, token, 1);
    }
    if (activeTab === "followers") navigate(`/${username}/follows?t=followers`);
    if (activeTab === "following") navigate(`/${username}/follows?t=following`);
  }, [activeTab, profileData]);

  useEffect(() => {
    if (profileData?.posts?.data) {
      setLocalPosts(profileData.posts.data.filter((p) => !p.is_repost));
    }
  }, [profileData?.posts]);

  const loadMorePosts = useCallback(() => {
    if (isLoadingPosts || postsPage >= postsLastPage) return;
    const next = postsPage + 1;
    setPostsPage(next);
    fetchPosts(username, token, next);
  }, [isLoadingPosts, postsPage, postsLastPage, username, token]);

  const loadMoreReplies = useCallback(() => {
    if (isLoadingReplies || repliesPage >= repliesLastPage) return;
    const next = repliesPage + 1;
    setRepliesPage(next);
    fetchReplies(username, token, next);
  }, [isLoadingReplies, repliesPage, repliesLastPage, username, token]);

  const loadMoreLikes = useCallback(() => {
    if (isLoadingLikedPosts || likesPage >= likesLastPage) return;
    const next = likesPage + 1;
    setLikesPage(next);
    fetchLikedPosts(username, token, next);
  }, [isLoadingLikedPosts, likesPage, likesLastPage, username, token]);

  const loadMoreReposts = useCallback(() => {
    if (isLoadingReposts || repostsPage >= repostsLastPage) return;
    const next = repostsPage + 1;
    setRepostsPage(next);
    fetchReposts(username, token, next);
  }, [isLoadingReposts, repostsPage, repostsLastPage, username, token]);

  useEffect(() => {
    const handleScroll = () => {
      const scrolledToBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 300;
      if (!scrolledToBottom) return;
      if (activeTab === "posts") loadMorePosts();
      else if (activeTab === "replies") loadMoreReplies();
      else if (activeTab === "likes") loadMoreLikes();
      else if (activeTab === "reposts") loadMoreReposts();
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [
    activeTab,
    loadMorePosts,
    loadMoreReplies,
    loadMoreLikes,
    loadMoreReposts,
  ]);

  const handleFollow = () => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    if (isFollowing) unfollowUser(username, token);
    else followUser(username, token);
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleEditSave = async () => {
    setEditSaving(true);
    let finalForm = { ...editForm };
    if (avatarFile) {
      setAvatarUploading(true);
      const result = await uploadAvatar(avatarFile, token);
      setAvatarUploading(false);
      if (result && !result.error) finalForm.avatar = result.url;
    }
    await updateProfile(username, finalForm, token);
    setEditSaving(false);
    setAvatarFile(null);
    setAvatarPreview(null);
    setEditOpen(false);
  };

  const handlePostDeleted = (id) => {
    setLocalPosts((prev) => (prev ?? []).filter((p) => p.id !== id));
  };

  const handlePostEdited = (id, newContent) => {
    setLocalPosts((prev) =>
      (prev ?? []).map((p) =>
        p.id === id ? { ...p, content: newContent } : p,
      ),
    );
  };

  const handleNewPost = () => {
    setPostsPage(1);
    fetchPosts(username, token, 1, true);
  };

  const allPostsData = profileData?.posts?.data ?? [];
  const storeReposts = allPostsData.filter((p) => p.is_repost);
  const originals = localPosts ?? allPostsData.filter((p) => !p.is_repost);
  const posts = [...originals, ...storeReposts].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  );
  const replies = profileData?.replies?.data ?? [];
  const likedPosts = profileData?.likedPosts?.data ?? [];
  const reposts = profileData?.reposts?.data ?? [];
  const mediaPosts = posts.filter((p) => p.media && p.media.length > 0);

  const joinedDate = info?.created_at
    ? new Date(info.created_at).toLocaleDateString("en-NG", {
        month: "long",
        year: "numeric",
      })
    : null;

  const renderTab = () => {
    if (activeTab === "posts") {
      if (isLoadingPosts && !posts.length)
        return [1, 2, 3].map((k) => <SkeletonPost key={k} />);
      if (!posts.length) return <EmptyState label="posts" />;
      return (
        <>
          {posts.map((p) => (
            <PostCard
              key={p.is_repost ? `repost-${p.id}` : `post-${p.id}`}
              post={p}
              isReply={false}
              token={token}
              myInfo={myInfo}
              myUsername={myUsername}
              onDeleted={handlePostDeleted}
              onEdited={handlePostEdited}
              repostedByUsername={p.is_repost ? username : null}
            />
          ))}
          {isLoadingPosts && posts.length > 0 && <LoadingSpinner />}
        </>
      );
    }
    if (activeTab === "replies") {
      if (isLoadingReplies && !replies.length)
        return [1, 2, 3].map((k) => <SkeletonPost key={k} />);
      if (!replies.length) return <EmptyState label="replies" />;
      return (
        <>
          {replies.map((p) => (
            <ReplyCard
              key={p.id}
              post={p}
              token={token}
              myInfo={myInfo}
              myUsername={myUsername}
              onDeleted={handlePostDeleted}
            />
          ))}
          {isLoadingReplies && replies.length > 0 && <LoadingSpinner />}
        </>
      );
    }
    if (activeTab === "media") {
      if (isLoadingPosts && !mediaPosts.length)
        return [1, 2, 3].map((k) => <SkeletonPost key={k} />);
      if (!mediaPosts.length) return <EmptyState label="media" />;
      return (
        <div className="media-grid">
          {mediaPosts.map((p) =>
            p.media.map((m) =>
              m.type === "video" ? (
                <div
                  key={m.id}
                  className="media-cell"
                  onClick={() => navigate(`/${p.user?.username}/post/${p.id}`)}
                >
                  <video
                    src={m.path}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              ) : (
                <div
                  key={m.id}
                  className="media-cell"
                  style={{
                    backgroundImage: `url(${m.path})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    cursor: "pointer",
                  }}
                  onClick={() => navigate(`/${p.user?.username}/post/${p.id}`)}
                />
              ),
            ),
          )}
        </div>
      );
    }
    if (activeTab === "likes") {
      if (isLoadingLikedPosts && !likedPosts.length)
        return [1, 2, 3].map((k) => <SkeletonPost key={k} />);
      if (!likedPosts.length) return <EmptyState label="liked posts" />;
      return (
        <>
          {likedPosts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              isReply={false}
              token={token}
              myInfo={myInfo}
              myUsername={myUsername}
              onDeleted={handlePostDeleted}
              onEdited={handlePostEdited}
            />
          ))}
          {isLoadingLikedPosts && likedPosts.length > 0 && <LoadingSpinner />}
        </>
      );
    }
    if (activeTab === "reposts") {
      if (isLoadingReposts && !reposts.length)
        return [1, 2, 3].map((k) => <SkeletonPost key={k} />);
      if (!reposts.length) return <EmptyState label="reposts" />;
      return (
        <>
          {reposts.map((p) => (
            <PostCard
              key={`repost-${p.repost_id ?? p.post?.id ?? p.id}`}
              post={{ ...(p.post ?? p), is_repost: true }}
              isReply={false}
              token={token}
              myInfo={myInfo}
              myUsername={myUsername}
              onDeleted={handlePostDeleted}
              onEdited={handlePostEdited}
              repostedByUsername={p.reposted_by?.username ?? username}
            />
          ))}
          {isLoadingReposts && reposts.length > 0 && <LoadingSpinner />}
        </>
      );
    }
  };

  if (isLoadingProfile) return <SkeletonProfile />;

  if (error && !info) {
    return (
      <div
        style={{
          padding: "3rem 1.5rem",
          textAlign: "center",
          color: "var(--text3)",
        }}
      >
        <p>{error}</p>
        <button
          className="edit-btn"
          style={{ marginTop: "1rem" }}
          onClick={() => navigate(-1)}
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <>
      {lightboxOpen && (
        <AvatarLightbox
          src={info?.avatar}
          name={info?.display_name}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      <div className="profile-header-bar">
        <button className="back-btn" onClick={() => navigate("/")}>
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
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>
            {info?.display_name}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text3)" }}>
            {fmt(
              (profileData?.posts?.total ?? 0) +
                (profileData?.replies?.total ?? 0),
            )}{" "}
            posts
          </div>
        </div>
      </div>

      <div className="cover" />

      <div className="profile-info-section" style={{ paddingTop: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            paddingTop: "0.75rem",
            marginBottom: "2.5rem",
          }}
        >
          {isMine ? (
            <button className="edit-btn" onClick={() => setEditOpen(true)}>
              Edit profile
            </button>
          ) : isAuthenticated ? (
            <button
              className={`edit-btn${isFollowing ? " following" : ""}`}
              style={
                isFollowing
                  ? {
                      background: "transparent",
                      border: "1.5px solid var(--border2)",
                      color: "var(--text2)",
                    }
                  : {}
              }
              onClick={handleFollow}
              disabled={isFollowLoading}
            >
              {isFollowLoading ? "…" : isFollowing ? "Following" : "Follow"}
            </button>
          ) : (
            <button className="edit-btn" onClick={() => navigate("/auth")}>
              Follow
            </button>
          )}
        </div>

        <div className="profile-avatar-wrap">
          <div
            className="profile-avatar"
            onClick={() => setLightboxOpen(true)}
            style={{ cursor: "pointer" }}
          >
            {info?.avatar ? (
              <img
                src={info.avatar}
                loading="lazy"
                alt={info.display_name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "50%",
                }}
              />
            ) : (
              getInitials(info?.display_name)
            )}
          </div>
        </div>

        <div style={{ marginBottom: "0.3rem" }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: "1.15rem",
              letterSpacing: "-0.01em",
            }}
          >
            {info?.display_name}
          </div>
          <div
            style={{
              color: "var(--text3)",
              fontSize: "0.85rem",
              marginTop: "0.1rem",
            }}
          >
            @{info?.username}
          </div>
        </div>

        {info?.bio && (
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--text2)",
              lineHeight: 1.6,
              marginTop: "0.6rem",
              maxWidth: "420px",
            }}
          >
            {info.bio}
          </p>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.25rem",
            marginTop: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          {info?.website && (
            <a
              href={
                info.website.startsWith("http")
                  ? info.website
                  : `https://${info.website}`
              }
              target="_blank"
              rel="noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                fontSize: "0.8rem",
                color: "var(--accent)",
                textDecoration: "none",
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              {info.website.replace(/^https?:\/\//, "")}
            </a>
          )}
          {joinedDate && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                fontSize: "0.8rem",
                color: "var(--text3)",
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Joined {joinedDate}
            </div>
          )}
        </div>

        <div className="stat-row">
          <div
            className="stat-item"
            style={{ cursor: "pointer" }}
            onClick={() => navigate(`/${username}/follows?t=following`)}
          >
            <span className="stat-num">
              {fmt(profileData?.following_count ?? 0)}
            </span>
            <span className="stat-label">Following</span>
          </div>
          <div
            className="stat-item"
            style={{ cursor: "pointer" }}
            onClick={() => navigate(`/${username}/follows?t=followers`)}
          >
            <span className="stat-num">
              {fmt(profileData?.followers_count ?? 0)}
            </span>
            <span className="stat-label">Followers</span>
          </div>
        </div>

        <div className="profile-tabs">
          {["posts", "replies", "media", "likes", "reposts"].map((tab) => (
            <button
              key={tab}
              className={`ptab${activeTab === tab ? " active" : ""}`}
              onClick={() => setActiveTab(tab)}
              style={{ textTransform: "capitalize" }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {isMine && activeTab === "posts" && myInfo && (
        <ComposePost
          myInfo={myInfo}
          token={token}
          username={username}
          onPosted={handleNewPost}
        />
      )}

      <div id="tab-content">{renderTab()}</div>

      {editOpen && isMine && (
        <div
          className="modal-bg open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditOpen(false);
          }}
        >
          <div className="modal-box">
            <div className="modal-head">
              <div className="serif" style={{ fontSize: "1.1rem" }}>
                Edit Profile
              </div>
              <button className="close-btn" onClick={() => setEditOpen(false)}>
                ✕
              </button>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.9rem",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "1rem" }}
              >
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      overflow: "hidden",
                      background: "var(--surface2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.3rem",
                      fontWeight: 700,
                    }}
                  >
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        loading="lazy"
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : editForm.avatar ? (
                      <img
                        src={editForm.avatar}
                        loading="lazy"
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      getInitials(editForm.display_name)
                    )}
                  </div>
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    style={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      width: 22,
                      height: 22,
                      background: "var(--accent)",
                      border: "2px solid var(--surface)",
                      borderRadius: "50%",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2.5"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleAvatarSelect}
                  />
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text3)" }}>
                  Click the + to upload a new photo from your device
                </div>
              </div>

              {[
                { label: "Display name", key: "display_name", type: "text" },
                { label: "Website", key: "website", type: "text" },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--text3)",
                      display: "block",
                      marginBottom: "0.35rem",
                    }}
                  >
                    {label}
                  </label>
                  <input
                    type={type}
                    value={editForm[key]}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, [key]: e.target.value }))
                    }
                    style={{
                      width: "100%",
                      background: "var(--surface2)",
                      border: "1px solid var(--border2)",
                      borderRadius: "9px",
                      padding: "0.6rem 0.85rem",
                      fontFamily: "'Instrument Sans', sans-serif",
                      fontSize: "0.9rem",
                      color: "var(--text)",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              ))}
              <div>
                <label
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--text3)",
                    display: "block",
                    marginBottom: "0.35rem",
                  }}
                >
                  Bio
                </label>
                <textarea
                  rows="3"
                  value={editForm.bio}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, bio: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    background: "var(--surface2)",
                    border: "1px solid var(--border2)",
                    borderRadius: "9px",
                    padding: "0.6rem 0.85rem",
                    fontFamily: "'Instrument Sans', sans-serif",
                    fontSize: "0.9rem",
                    color: "var(--text)",
                    outline: "none",
                    resize: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.6rem",
                  marginTop: "0.25rem",
                }}
              >
                <button
                  onClick={() => {
                    setEditOpen(false);
                    setAvatarFile(null);
                    setAvatarPreview(null);
                  }}
                  style={{
                    background: "transparent",
                    border: "1.5px solid var(--border2)",
                    borderRadius: 9,
                    padding: "0.6rem 1.1rem",
                    fontFamily: "'Instrument Sans', sans-serif",
                    fontSize: "0.875rem",
                    color: "var(--text2)",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={editSaving || avatarUploading}
                  style={{
                    background: "var(--accent)",
                    color: "var(--accent-text)",
                    border: "none",
                    borderRadius: "9px",
                    padding: "0.6rem 1.5rem",
                    fontFamily: "'Instrument Sans', sans-serif",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    opacity: editSaving || avatarUploading ? 0.6 : 1,
                  }}
                >
                  {avatarUploading
                    ? "Uploading…"
                    : editSaving
                      ? "Saving…"
                      : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;
