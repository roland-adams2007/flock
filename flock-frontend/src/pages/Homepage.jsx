import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
        loading="lazy"
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
        flexShrink: 0,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {getInitials(name)}
    </div>
  );
}

function MediaGrid({ media, onImageClick }) {
  if (!media || media.length === 0) return null;
  const count = media.length;
  const gridStyle =
    count === 1
      ? { gridTemplateColumns: "1fr" }
      : count === 2
        ? { gridTemplateColumns: "1fr 1fr", gridTemplateRows: "200px" }
        : { gridTemplateColumns: "1fr 1fr", gridTemplateRows: "150px 150px" };

  return (
    <div
      style={{
        display: "grid",
        gap: "0.2rem",
        borderRadius: "12px",
        overflow: "hidden",
        marginBottom: "0.75rem",
        ...gridStyle,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {media.slice(0, 4).map((m, i) => (
        <div
          key={m.id ?? i}
          style={{
            position: "relative",
            overflow: "hidden",
            cursor: "pointer",
            gridColumn: count === 3 && i === 0 ? "1 / -1" : undefined,
            height:
              count === 1 ? "auto" : count === 3 && i === 0 ? 180 : undefined,
          }}
          onClick={() => onImageClick && onImageClick(i)}
        >
          {m.type === "video" ? (
            <video
              src={m.path}
              controls
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={m.path}
              loading="lazy"
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          )}
          {count > 4 && i === 3 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.55)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.4rem",
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

function MediaPreviewComposer({ items, onRemove }) {
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
              loading="lazy"
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
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
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

function PostSkeleton() {
  return (
    <div
      style={{
        padding: "1rem 1.25rem",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        gap: "0.75rem",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
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
          gap: "0.5rem",
          paddingTop: 4,
        }}
      >
        <div
          style={{
            width: "45%",
            height: 12,
            background: "var(--surface2)",
            borderRadius: 5,
            animation: "skelPulse 1.4s ease-in-out infinite",
          }}
        />
        <div
          style={{
            width: "90%",
            height: 14,
            background: "var(--surface2)",
            borderRadius: 5,
            animation: "skelPulse 1.4s ease-in-out infinite",
          }}
        />
        <div
          style={{
            width: "70%",
            height: 14,
            background: "var(--surface2)",
            borderRadius: 5,
            animation: "skelPulse 1.4s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
}

function PostCard({ post, token, isAuthenticated, myUsername }) {
  const navigate = useNavigate();
  const { likePost, unlikePost, repostPost, unrepostPost, updateFeedPost } =
    usePostStore();
  const [liked, setLiked] = useState(post.is_liked ?? false);
  const [likeCount, setLikeCount] = useState(post.counts?.likes ?? 0);
  const [reposted, setReposted] = useState(post.is_reposted ?? false);
  const [repostCount, setRepostCount] = useState(post.counts?.reposts ?? 0);

  const toggleLike = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    const wasLiked = liked;
    setLiked(!wasLiked);
    const next = wasLiked ? Math.max(0, likeCount - 1) : likeCount + 1;
    setLikeCount(next);
    updateFeedPost(post.id, {
      is_liked: !wasLiked,
      counts: { ...post.counts, likes: next },
    });
    if (wasLiked) await unlikePost(post.id, token);
    else await likePost(post.id, token);
  };

  const toggleRepost = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    const wasReposted = reposted;
    setReposted(!wasReposted);
    const next = wasReposted ? Math.max(0, repostCount - 1) : repostCount + 1;
    setRepostCount(next);
    updateFeedPost(post.id, {
      is_reposted: !wasReposted,
      counts: { ...post.counts, reposts: next },
    });
    if (wasReposted) await unrepostPost(post.id, token);
    else await repostPost(post.id, token);
  };

  const btnStyle = (active, activeColor = "var(--accent)") => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "0.3rem",
    padding: "0.3rem 0.5rem",
    borderRadius: 7,
    border: "none",
    background: "none",
    cursor: "pointer",
    fontSize: "0.78rem",
    fontFamily: "'Instrument Sans', sans-serif",
    color: active ? activeColor : "var(--text3)",
    transition: "color 0.15s",
  });

  return (
    <div
      style={{
        padding: "1rem 1.25rem",
        borderBottom: "1px solid var(--border)",
        cursor: "pointer",
        transition: "background 0.12s",
      }}
      onClick={() => navigate(`/${post.user?.username}/post/${post.id}`)}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "var(--surface2)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
    >
      {post.is_repost && (
        <div
          style={{
            fontSize: "0.75rem",
            color: "var(--text3)",
            marginBottom: "0.4rem",
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            paddingLeft: "2.75rem",
          }}
        >
          <svg
            width="12"
            height="12"
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
          Reposted
        </div>
      )}

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <Avatar
          src={post.user?.avatar}
          name={post.user?.display_name}
          size={40}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/${post.user?.username}`);
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              marginBottom: "0.3rem",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontWeight: 600,
                fontSize: "0.88rem",
                cursor: "pointer",
                color: "var(--text)",
              }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/${post.user?.username}`);
              }}
            >
              {post.user?.display_name}
            </span>
            <span
              style={{
                color: "var(--text3)",
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/${post.user?.username}`);
              }}
            >
              @{post.user?.username}
            </span>
            <span style={{ color: "var(--text3)", fontSize: "0.78rem" }}>
              · {timeAgo(post.created_at)}
            </span>
          </div>

          {post.content && (
            <div
              style={{
                fontSize: "0.9rem",
                lineHeight: 1.6,
                color: "var(--text)",
                marginBottom: "0.6rem",
                whiteSpace: "pre-line",
              }}
            >
              {post.content}
            </div>
          )}

          {post.media && post.media.length > 0 && (
            <MediaGrid
              media={post.media}
              onImageClick={(i) =>
                navigate(`/${post.user?.username}/post/${post.id}`)
              }
            />
          )}

          <div
            style={{ display: "flex", gap: "0.1rem", marginTop: "0.25rem" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={btnStyle(false)}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/${post.user?.username}/post/${post.id}`);
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {(post.counts?.replies ?? 0) > 0 && fmt(post.counts.replies)}
            </button>

            <button style={btnStyle(reposted)} onClick={toggleRepost}>
              <svg
                width="14"
                height="14"
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
              {repostCount > 0 && fmt(repostCount)}
            </button>

            <button style={btnStyle(liked, "var(--red)")} onClick={toggleLike}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill={liked ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {likeCount > 0 && fmt(likeCount)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const Homepage = () => {
  const navigate = useNavigate();
  const { token, isAuthenticated, me } = useAuthStore();
  const {
    feed,
    isLoadingFeed,
    feedPage,
    feedLastPage,
    fetchFeed,
    clearFeed,
    createPost,
    uploadMedia,
    prependToFeed,
  } = usePostStore();

  const [postText, setPostText] = useState("");
  const [posting, setPosting] = useState(false);
  const [mediaItems, setMediaItems] = useState([]);
  const mediaInputRef = useRef(null);
  const sentinelRef = useRef(null);
  const initialized = useRef(false);

  useEffect(() => {
    clearFeed();
    fetchFeed(token, 1);
    initialized.current = true;
  }, [token]);

  const loadMore = useCallback(() => {
    if (isLoadingFeed || feedPage >= feedLastPage) return;
    fetchFeed(token, feedPage + 1);
  }, [isLoadingFeed, feedPage, feedLastPage, token]);

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

  const handleMediaSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = 4 - mediaItems.length;
    const toProcess = files.slice(0, remaining);

    const newItems = toProcess.map((file) => ({
      localUrl: URL.createObjectURL(file),
      type: file.type.startsWith("video") ? "video" : "image",
      uploading: true,
      url: null,
      uploadType: null,
    }));

    setMediaItems((prev) => [...prev, ...newItems]);
    e.target.value = "";

    const startIndex = mediaItems.length;
    await Promise.all(
      toProcess.map(async (file, i) => {
        const result = await uploadMedia(file, token);
        setMediaItems((prev) => {
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
      }),
    );
  };

  const removeMedia = (index) => {
    setMediaItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      if (item?.localUrl) URL.revokeObjectURL(item.localUrl);
      updated.splice(index, 1);
      return updated;
    });
  };

  const submitPost = async () => {
    if ((!postText.trim() && mediaItems.length === 0) || posting) return;
    const stillUploading = mediaItems.some((m) => m.uploading);
    if (stillUploading) return;

    const mediaPayload = mediaItems
      .filter((m) => m.url)
      .map((m) => ({ url: m.url, type: m.uploadType ?? m.type }));

    setPosting(true);
    const result = await createPost(
      postText,
      token,
      me?.username,
      mediaPayload,
    );
    if (result?.success && result?.post) {
      prependToFeed(result.post);
      setPostText("");
      setMediaItems([]);
    }
    setPosting(false);
  };

  const stillUploading = mediaItems.some((m) => m.uploading);
  const canPost =
    (postText.trim() || mediaItems.length > 0) && !posting && !stillUploading;

  return (
    <>
      <style>{`
        @keyframes skelPulse { 0%,100%{opacity:1}50%{opacity:0.4} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none} }
      `}</style>

      <div
        style={{
          padding: "0.75rem 1.25rem",
          borderBottom: "1px solid var(--border)",
          fontWeight: 700,
          fontSize: "1rem",
        }}
      >
        Home
      </div>

      {isAuthenticated && (
        <div
          style={{
            padding: "1rem 1.25rem",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            gap: "0.85rem",
          }}
        >
          <Avatar src={me?.avatar} name={me?.display_name} size={38} />
          <div style={{ flex: 1 }}>
            <textarea
              rows="2"
              placeholder="What's on your mind?"
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submitPost();
              }}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                fontFamily: "'Instrument Sans', sans-serif",
                fontSize: "0.95rem",
                color: "var(--text)",
                resize: "none",
                lineHeight: 1.55,
                boxSizing: "border-box",
              }}
            />
            {mediaItems.length > 0 && (
              <MediaPreviewComposer items={mediaItems} onRemove={removeMedia} />
            )}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "0.6rem",
              }}
            >
              <div style={{ display: "flex", gap: "0.25rem" }}>
                {mediaItems.length < 4 && (
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
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect
                          x="3"
                          y="3"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={submitPost}
                disabled={!canPost}
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-text)",
                  border: "none",
                  borderRadius: 20,
                  padding: "0.42rem 1.2rem",
                  fontFamily: "'Instrument Sans', sans-serif",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: canPost ? "pointer" : "not-allowed",
                  opacity: canPost ? 1 : 0.5,
                  transition: "opacity 0.15s",
                }}
              >
                {posting ? "Posting…" : stillUploading ? "Uploading…" : "Post"}
              </button>
            </div>
          </div>
        </div>
      )}

      {!isAuthenticated && (
        <div
          style={{
            padding: "1.25rem",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
              Join the conversation
            </div>
            <div
              style={{
                color: "var(--text3)",
                fontSize: "0.82rem",
                marginTop: "0.2rem",
              }}
            >
              Sign in to post and interact
            </div>
          </div>
          <button
            onClick={() => navigate("/auth")}
            style={{
              background: "var(--accent)",
              color: "var(--accent-text)",
              border: "none",
              borderRadius: 20,
              padding: "0.5rem 1.2rem",
              fontFamily: "'Instrument Sans', sans-serif",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Sign in
          </button>
        </div>
      )}

      {isLoadingFeed && feed.length === 0 ? (
        [1, 2, 3, 4, 5].map((k) => <PostSkeleton key={k} />)
      ) : feed.length === 0 ? (
        <div
          style={{
            padding: "3rem 1.5rem",
            textAlign: "center",
            color: "var(--text3)",
            fontSize: "0.875rem",
          }}
        >
          {isAuthenticated
            ? "Follow people to see their posts here, or check back later for trending content."
            : "No posts yet."}
        </div>
      ) : (
        <>
          {feed.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              token={token}
              isAuthenticated={isAuthenticated}
              myUsername={me?.username}
            />
          ))}
          <div ref={sentinelRef} style={{ height: 1 }} />
          {isLoadingFeed && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "1.25rem",
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  border: "2px solid var(--border2)",
                  borderTopColor: "var(--accent)",
                  borderRadius: "50%",
                  animation: "spin 0.7s linear infinite",
                }}
              />
            </div>
          )}
          {feedPage >= feedLastPage && feed.length > 0 && (
            <div
              style={{
                padding: "1.5rem",
                textAlign: "center",
                color: "var(--text3)",
                fontSize: "0.8rem",
              }}
            >
              You're all caught up
            </div>
          )}
        </>
      )}
    </>
  );
};

export default Homepage;
