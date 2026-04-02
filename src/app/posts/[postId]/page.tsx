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
      // Refresh comments
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
      body: JSON.stringify({ otherUser: post.sellerUser }),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/messages?conv=${data.conversationId}`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-gray-400">
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => router.back()}
        className="text-sm text-gray-500 hover:text-navy mb-6 flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="grid md:grid-cols-[1fr_320px] gap-8">
        {/* Main content */}
        <div>
          {/* Images */}
          {images.length > 0 && (
            <div className="mb-6 rounded-2xl overflow-hidden bg-white border border-gray-100">
              <img
                src={images[0].imageUrl}
                alt={post.title}
                className="w-full max-h-96 object-contain bg-cream-dark"
              />
              {images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {images.map((img) => (
                    <img
                      key={img.imageId}
                      src={img.imageUrl}
                      alt=""
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {editing ? (
            <form onSubmit={handleEdit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
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
            <>
              <div className="mb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <span
                      className={`inline-block px-3 py-1 text-xs font-semibold rounded-full mb-3 ${
                        post.isDigital
                          ? "bg-blue-100 text-blue-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {post.isDigital ? "Digital" : "Physical"}
                    </span>
                    <h1 className="text-2xl font-bold text-navy-dark">
                      {post.title}
                    </h1>
                  </div>
                </div>

                <Link
                  href={`/courses/${post.courseId}`}
                  className="inline-block mt-2 text-sm font-medium text-orange hover:underline"
                >
                  {post.deptCode} {post.courseNumber} — {post.courseName}
                </Link>

                <p className="text-gray-600 mt-4 leading-relaxed whitespace-pre-wrap">
                  {post.description}
                </p>

                {/* Physical post details */}
                {!post.isDigital && (
                  <div className="mt-4 flex gap-4 text-sm">
                    {post.location && (
                      <span className="flex items-center gap-1 text-gray-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {post.location}
                      </span>
                    )}
                    {post.condition && (
                      <span className="text-gray-500">
                        Condition: {post.condition}
                      </span>
                    )}
                  </div>
                )}

                {/* Digital download link */}
                {post.isDigital && post.fileUrl && (
                  <a
                    href={post.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download File
                  </a>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 mb-8">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    userLiked
                      ? "bg-red-50 text-red-600 border border-red-200"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-red-200 hover:text-red-500"
                  }`}
                >
                  <svg className="w-4 h-4" fill={userLiked ? "currentColor" : "none"} viewBox="0 0 20 20" stroke="currentColor">
                    <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                  </svg>
                  {likeCount}
                </button>

                {!isOwner && currentUser && (
                  <button
                    onClick={handleMessageOwner}
                    className="px-4 py-2 bg-navy text-white rounded-xl text-sm font-medium hover:bg-navy-light transition-colors"
                  >
                    Message Owner
                  </button>
                )}

                {isOwner && (
                  <>
                    <button
                      onClick={() => setEditing(true)}
                      className="px-4 py-2 bg-white text-gray-600 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setShowDelete(true)}
                      className="px-4 py-2 bg-white text-red-500 border border-red-200 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </>
          )}

          {/* Comments */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-navy-dark mb-4">
              Comments ({comments.length})
            </h2>

            {currentUser && (
              <form onSubmit={handleAddComment} className="mb-6">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl bg-cream focus:outline-none focus:ring-2 focus:ring-orange/50"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-navy text-white rounded-xl text-sm font-medium hover:bg-navy-light transition-colors"
                  >
                    Post
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {comments.map((c) => (
                <div key={c.commentId} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center text-navy flex-shrink-0">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                    </svg>
                  </div>
                  <div className="flex-1">
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
                    <p className="text-sm text-gray-600 mt-1">{c.content}</p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  No comments yet.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Posted by
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange/10 flex items-center justify-center text-orange">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-navy-dark">
                  {post.sellerUser}
                </p>
                <p className="text-xs text-gray-400">{date}</p>
              </div>
            </div>
          </div>
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
