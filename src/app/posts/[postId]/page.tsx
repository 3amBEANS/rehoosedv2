"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ConfirmModal from "@/components/ConfirmModal";

interface PostDetail {
  postId: number;
  title: string;
  description: string;
  createdAt: string;
  sellerUser: string;
  courseId: number;
  courseName: string;
  courseNumber: string;
  deptCode: string;
  isDigital: number;
  likeCount: number;
  fileUrl?: string;
  location?: string;
  condition?: string;
  sellerPhoto?: string;
}

interface ImageRow {
  imageId: number;
  imageUrl: string;
}

interface CommentRow {
  commentId: number;
  content: string;
  timestamp: string;
  user: string;
  profilePhoto?: string;
}

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const router = useRouter();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [images, setImages] = useState<ImageRow[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [userLiked, setUserLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [newComment, setNewComment] = useState("");

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editFileUrl, setEditFileUrl] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editCondition, setEditCondition] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const [postRes, userRes] = await Promise.all([
        fetch(`/api/posts/${postId}`),
        fetch("/api/auth/me"),
      ]);

      if (!postRes.ok) {
        router.push("/posts");
        return;
      }

      const postData = await postRes.json();
      const userData = await userRes.json();

      setPost(postData.post);
      setImages(postData.images);
      setComments(postData.comments);
      setUserLiked(postData.userLiked);
      setLikeCount(postData.post.likeCount);
      setCurrentUser(userData.user?.username || null);

      setEditTitle(postData.post.title);
      setEditDesc(postData.post.description);
      setEditFileUrl(postData.post.fileUrl || "");
      setEditLocation(postData.post.location || "");
      setEditCondition(postData.post.condition || "");

      setLoading(false);
    };
    fetchData();
  }, [postId, router]);

  const handleLike = async () => {
    const res = await fetch(`/api/posts/${postId}/likes`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setUserLiked(data.liked);
      setLikeCount((c) => (data.liked ? c + 1 : c - 1));
    }
  };

  const handleDelete = async () => {
    const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/posts");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/posts/${postId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle,
        description: editDesc,
        fileUrl: editFileUrl,
        location: editLocation,
        condition: editCondition,
      }),
    });
    if (res.ok) {
      setPost((p) =>
        p
          ? {
              ...p,
              title: editTitle,
              description: editDesc,
              fileUrl: editFileUrl,
              location: editLocation,
              condition: editCondition,
            }
          : null
      );
      setEditing(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newComment }),
    });
    if (res.ok) {
      setNewComment("");
      const commentsRes = await fetch(`/api/posts/${postId}/comments`);
      const data = await commentsRes.json();
      setComments(data);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId }),
    });
    if (res.ok) {
      setComments((c) => c.filter((cm) => cm.commentId !== commentId));
    }
  };

  const handleMessageOwner = async () => {
    if (!post) return;
    const res = await fetch("/api/messages/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        otherUser: post.sellerUser,
        postId: post.postId,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/messages?conv=${data.conversationId}`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center text-gray-400">
        Loading...
      </div>
    );
  }

  if (!post) return null;

  const isOwner = currentUser === post.sellerUser;
  const date = new Date(post.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const heroImage = images[activeImage]?.imageUrl;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <button
        onClick={() => router.back()}
        className="text-sm text-gray-500 hover:text-navy mb-5 inline-flex items-center gap-1.5 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {editing ? (
        /* Edit form takes over the whole hero */
        <form
          onSubmit={handleEdit}
          className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 mb-6"
        >
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-lg font-bold"
            required
          />
          <textarea
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            rows={4}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl resize-none"
            required
          />
          {post.isDigital ? (
            <input
              type="url"
              value={editFileUrl}
              onChange={(e) => setEditFileUrl(e.target.value)}
              placeholder="File URL"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl"
            />
          ) : (
            <>
              <input
                type="text"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                placeholder="Location"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl"
              />
              <select
                value={editCondition}
                onChange={(e) => setEditCondition(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl"
              >
                <option>Like New</option>
                <option>Good</option>
                <option>Acceptable</option>
                <option>Fair</option>
              </select>
            </>
          )}
          <div className="flex gap-3">
            <button
              type="submit"
              className="px-6 py-2.5 bg-navy text-white rounded-xl font-semibold hover:bg-navy-light transition-colors"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-6 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_400px] gap-6 lg:gap-8 mb-8">
          {/* Image gallery */}
          <div className="flex flex-col gap-3">
            <div className="relative aspect-square w-full bg-white rounded-2xl border border-gray-100 overflow-hidden flex items-center justify-center">
              {heroImage ? (
                <img
                  src={heroImage}
                  alt={post.title}
                  className="w-full h-full object-contain p-6"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-300">
                  {post.isDigital ? (
                    <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ) : (
                    <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  )}
                  <span className="mt-3 text-xs uppercase tracking-widest text-gray-400">
                    No preview
                  </span>
                </div>
              )}

              {/* Type badge — overlay top-left */}
              <span
                className={`absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full backdrop-blur-sm ${
                  post.isDigital
                    ? "bg-blue-500/95 text-white"
                    : "bg-emerald-500/95 text-white"
                }`}
              >
                {post.isDigital ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                )}
                {post.isDigital ? "Digital" : "Physical"}
              </span>
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={img.imageId}
                    onClick={() => setActiveImage(i)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      i === activeImage
                        ? "border-orange"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={img.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info panel */}
          <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
            {/* Course pill */}
            <Link
              href={`/courses/${post.courseId}`}
              className="inline-flex items-center self-start gap-1.5 px-3 py-1 bg-orange/10 text-orange rounded-full text-xs font-semibold hover:bg-orange/15 transition-colors"
            >
              {post.deptCode} {post.courseNumber}
              <span className="text-orange/70">·</span>
              <span className="text-orange/90 font-medium">{post.courseName}</span>
            </Link>

            {/* Title */}
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-navy-dark leading-tight tracking-tight">
              {post.title}
            </h1>

            {/* Description */}
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
              {post.description}
            </p>

            {/* Physical post details */}
            {!post.isDigital && (post.location || post.condition) && (
              <dl className="grid grid-cols-2 gap-3 py-3 border-y border-gray-100">
                {post.location && (
                  <div>
                    <dt className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                      Pickup
                    </dt>
                    <dd className="flex items-center gap-1.5 text-sm text-navy-dark font-medium">
                      <svg className="w-4 h-4 text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {post.location}
                    </dd>
                  </div>
                )}
                {post.condition && (
                  <div>
                    <dt className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                      Condition
                    </dt>
                    <dd className="text-sm text-navy-dark font-medium">
                      {post.condition}
                    </dd>
                  </div>
                )}
              </dl>
            )}

            {/* Primary action: download (digital only) */}
            {post.isDigital && post.fileUrl && (
              <a
                href={post.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 bg-navy hover:bg-navy-light text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download File
              </a>
            )}

            {/* Secondary actions row */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleLike}
                aria-label={userLiked ? "Unlike" : "Like"}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  userLiked
                    ? "bg-red-50 text-red-600 border border-red-200"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-red-200 hover:text-red-500"
                }`}
              >
                <svg className="w-4 h-4" fill={userLiked ? "currentColor" : "none"} viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.8}>
                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                </svg>
                {likeCount}
              </button>

              {!isOwner && currentUser && (
                <button
                  onClick={handleMessageOwner}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    post.isDigital && post.fileUrl
                      ? "bg-white text-navy-dark border border-gray-200 hover:border-navy hover:bg-navy/[0.03]"
                      : "bg-navy text-white hover:bg-navy-light shadow-sm"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Message Owner
                </button>
              )}

              {isOwner && (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="flex-1 px-4 py-2 bg-white text-navy-dark border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setShowDelete(true)}
                    aria-label="Delete listing"
                    className="px-3 py-2 bg-white text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a2 2 0 012-2h2a2 2 0 012 2v3" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Seller card */}
            <div className="mt-2 p-4 bg-white rounded-xl border border-gray-100">
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Posted by
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange/10 flex items-center justify-center text-orange flex-shrink-0">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-navy-dark truncate">
                    {post.sellerUser}
                  </p>
                  <p className="text-xs text-gray-400">{date}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments — full width below */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-navy-dark mb-5">
          Comments{" "}
          <span className="text-gray-400 font-medium">({comments.length})</span>
        </h2>

        {currentUser && (
          <form onSubmit={handleAddComment} className="mb-6">
            <div className="flex gap-3">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl bg-cream focus:outline-none focus:ring-2 focus:ring-orange/50 focus:bg-white transition-colors"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="px-5 py-2.5 bg-navy text-white rounded-xl text-sm font-semibold hover:bg-navy-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Post
              </button>
            </div>
          </form>
        )}

        <div className="space-y-5">
          {comments.map((c) => (
            <div key={c.commentId} className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-navy/10 flex items-center justify-center text-navy flex-shrink-0">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-navy-dark">
                    {c.user}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(c.timestamp).toLocaleDateString()}
                  </span>
                  {c.user === currentUser && (
                    <button
                      onClick={() => handleDeleteComment(c.commentId)}
                      className="text-xs text-gray-400 hover:text-red-500 ml-auto"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap break-words">
                  {c.content}
                </p>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">
              No comments yet. Be the first to ask a question.
            </p>
          )}
        </div>
      </div>

      {showDelete && (
        <ConfirmModal
          title="Delete Resource"
          message="Do you want to delete this resource? This action cannot be undone."
          confirmLabel="Yes, Delete"
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          danger
        />
      )}
    </div>
  );
}
