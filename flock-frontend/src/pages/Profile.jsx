import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProfileStore, useAuthStore } from "../store/store";

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

function Avatar({ src, name, size = 38 }) {
  if (src) {
    return (
      <img
        src={src}
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

function CommentModal({ post, token, myInfo, onClose, onCommentPosted }) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { createComment } = useProfileStore();

  const submit = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    await createComment(post.id, text, token);
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
  isMine,
  token,
  myInfo,
  myUsername,
  onDeleted,
  onEdited,
}) {
  const [liked, setLiked] = useState(post._liked ?? false);
  const [likeCount, setLikeCount] = useState(post?.counts?.likes ?? 0);
  const [reposted, setReposted] = useState(post._reposted ?? false);
  const [repostCount, setRepostCount] = useState(post?.counts?.reposts ?? 0);
  const [commentCount, setCommentCount] = useState(post?.counts?.comments ?? 0);
  const [showMenu, setShowMenu] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editText, setEditText] = useState(post.content ?? "");
  const [commentOpen, setCommentOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const menuRef = useRef(null);

  const { likePost, unlikePost, repostPost, deletePost, editPost } =
    useProfileStore();

  const isMyPost = myUsername && post.user?.username === myUsername;

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleLike = async () => {
    if (!token) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => (wasLiked ? c - 1 : c + 1));
    if (wasLiked) await unlikePost(post.id, token);
    else await likePost(post.id, token);
  };

  const toggleRepost = async () => {
    if (!token) return;
    setReposted(true);
    setRepostCount((c) => c + 1);
    await repostPost(post.id, token);
  };

  const handleDelete = async () => {
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

  const user = post.user;

  return (
    <>
      <div
        className="post-card"
        style={{ opacity: deleting ? 0.4 : 1, transition: "opacity 0.2s" }}
      >
        <div style={{ display: "flex", gap: "0.85rem" }}>
          <Avatar src={user?.avatar} name={user?.display_name} size={38} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div className="post-meta">
                <span className="post-name">{user?.display_name}</span>
                <span className="post-handle">@{user?.username}</span>
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
                <div style={{ position: "relative" }} ref={menuRef}>
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
                        onClick={() => {
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
                <span style={{ color: "var(--accent)" }}>
                  @{post.reply_to.user?.username}
                </span>
              </div>
            )}

            <div className="post-text">{post.content}</div>

            {post.media && post.media.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    post.media.length === 1 ? "1fr" : "1fr 1fr",
                  gap: "0.4rem",
                  marginTop: "0.65rem",
                  borderRadius: "12px",
                  overflow: "hidden",
                }}
              >
                {post.media.map((m) =>
                  m.type === "video" ? (
                    <video
                      key={m.id}
                      src={m.url}
                      controls
                      style={{
                        width: "100%",
                        borderRadius: "10px",
                        maxHeight: 280,
                      }}
                    />
                  ) : (
                    <img
                      key={m.id}
                      src={m.url}
                      alt=""
                      style={{
                        width: "100%",
                        objectFit: "cover",
                        maxHeight: 280,
                        borderRadius: post.media.length === 1 ? "12px" : "6px",
                      }}
                    />
                  ),
                )}
              </div>
            )}

            <div className="actions">
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
                onClick={() => token && setCommentOpen(true)}
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
                disabled={reposted}
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

function ComposePost({ myInfo, token, username, onPosted }) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { createPost } = useProfileStore();

  const submit = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    await createPost(text, token, username);
    setText("");
    setSubmitting(false);
    onPosted && onPosted();
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "0.6rem",
            }}
          >
            <button className="icon-btn">
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
              {submitting ? "Posting…" : "Post it"}
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
    activeUsername,
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
    isFollowing,
    isFollowLoading,
  } = useProfileStore();

  const { profiles: myProfiles } = useProfileStore();
  const { token: authToken } = useAuthStore();

  const [activeTab, setActiveTab] = useState("posts");
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: "",
    bio: "",
    website: "",
    avatar: "",
  });
  const [localPosts, setLocalPosts] = useState(null);

  const profileData = profiles[username] ?? null;
  const info = profileData?.info ?? null;
  const isMine = profileData?.mine ?? false;

  const myProfileData =
    activeUsername && profiles[activeUsername]
      ? profiles[activeUsername]
      : null;
  const myInfo = myProfileData?.info ?? null;
  const myUsername = myInfo?.username ?? null;

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
    if (activeTab === "posts" && !profileData.posts)
      fetchPosts(username, token);
    if (activeTab === "replies" && !profileData.replies)
      fetchReplies(username, token);
    if (activeTab === "likes" && !profileData.likedPosts)
      fetchLikedPosts(username, token);
    if (activeTab === "reposts" && !profileData.reposts)
      fetchReposts(username, token);
  }, [activeTab, profileData]);

  useEffect(() => {
    if (profileData?.posts?.data) setLocalPosts(profileData.posts.data);
  }, [profileData?.posts]);

  const handleFollow = () => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    if (isFollowing) unfollowUser(username, token);
    else followUser(username, token);
  };

  const handleEditSave = async () => {
    setEditSaving(true);
    await updateProfile(username, editForm, token);
    setEditSaving(false);
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
    fetchPosts(username, token);
  };

  const posts = localPosts ?? profileData?.posts?.data ?? [];
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
      return posts.map((p) => (
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
      ));
    }
    if (activeTab === "replies") {
      if (isLoadingReplies)
        return [1, 2, 3].map((k) => <SkeletonPost key={k} />);
      if (!replies.length) return <EmptyState label="replies" />;
      return replies.map((p) => (
        <PostCard
          key={p.id}
          post={p}
          isReply={true}
          token={token}
          myInfo={myInfo}
          myUsername={myUsername}
          onDeleted={handlePostDeleted}
          onEdited={handlePostEdited}
        />
      ));
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
                <div key={m.id} className="media-cell">
                  <video
                    src={m.url}
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
                    backgroundImage: `url(${m.url})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              ),
            ),
          )}
        </div>
      );
    }
    if (activeTab === "likes") {
      if (isLoadingLikedPosts)
        return [1, 2, 3].map((k) => <SkeletonPost key={k} />);
      if (!likedPosts.length) return <EmptyState label="liked posts" />;
      return likedPosts.map((p) => (
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
      ));
    }
    if (activeTab === "reposts") {
      if (isLoadingReposts)
        return [1, 2, 3].map((k) => <SkeletonPost key={k} />);
      if (!reposts.length) return <EmptyState label="reposts" />;
      return reposts.map((p) => (
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
      ));
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
          <div className="profile-avatar">
            {info?.avatar ? (
              <img
                src={info.avatar}
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
          <div className="stat-item">
            <span className="stat-num">
              {fmt(profileData?.following_count ?? 0)}
            </span>
            <span className="stat-label">Following</span>
          </div>
          <div className="stat-item">
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
              {[
                { label: "Display name", key: "display_name", type: "text" },
                { label: "Avatar URL", key: "avatar", type: "text" },
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
                  onClick={() => setEditOpen(false)}
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
                  disabled={editSaving}
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
                    opacity: editSaving ? 0.6 : 1,
                  }}
                >
                  {editSaving ? "Saving…" : "Save changes"}
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
