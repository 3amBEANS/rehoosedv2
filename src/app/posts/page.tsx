"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import PostCard from "@/components/PostCard";
import SearchBar from "@/components/SearchBar";

interface PostRow {
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
  thumbnail: string | null;
  likeCount: number;
  commentCount: number;
  fileUrl?: string;
  location?: string;
  condition?: string;
}

export default function BrowsePostsPage() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto px-4 py-20 text-center text-gray-400">Loading...</div>}>
      <BrowsePostsContent />
    </Suspense>
  );
}

function BrowsePostsContent() {
  const searchParams = useSearchParams();
  const showNew = searchParams.get("new") === "true";
  const courseIdParam = searchParams.get("courseId") || "";

  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // New post form
  const [showForm, setShowForm] = useState(showNew);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCourseId, setNewCourseId] = useState(courseIdParam);
  const [newIsDigital, setNewIsDigital] = useState(true);
  const [newFileUrl, setNewFileUrl] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newCondition, setNewCondition] = useState("Good");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Course search for form
  const [courseSearch, setCourseSearch] = useState("");
  const [courseResults, setCourseResults] = useState<Array<{ courseId: number; courseName: string; deptCode: string; courseNumber: string }>>([]);
  const [selectedCourseName, setSelectedCourseName] = useState("");

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (typeFilter) params.set("type", typeFilter);
    if (conditionFilter) params.set("condition", conditionFilter);
    if (sort) params.set("sort", sort);
    const res = await fetch(`/api/posts?${params.toString()}`);
    const data = await res.json();
    setPosts(data);
    setLoading(false);
  }, [search, typeFilter, conditionFilter, sort]);

  useEffect(() => {
    fetchPosts();
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setCurrentUser(d.user?.username || null));
  }, [fetchPosts]);

  const searchCourses = async (q: string) => {
    setCourseSearch(q);
    if (q.length < 2) {
      setCourseResults([]);
      return;
    }
    const res = await fetch(`/api/courses?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setCourseResults(data.slice(0, 8));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle,
        description: newDesc,
        courseId: Number(newCourseId),
        isDigital: newIsDigital,
        fileUrl: newFileUrl,
        location: newLocation,
        condition: newCondition,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setFormError(data.error || "Failed to create post");
      return;
    }

    setShowForm(false);
    setNewTitle("");
    setNewDesc("");
    setNewCourseId("");
    setNewFileUrl("");
    setNewLocation("");
    fetchPosts();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-navy-dark">Browse Listings</h1>
        {currentUser && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-5 py-2.5 bg-orange hover:bg-orange-light text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {showForm ? "Cancel" : "New Post"}
          </button>
        )}
      </div>

      {/* Create post form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-bold text-navy-dark mb-4">
            Create a New Listing
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Title
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-cream focus:outline-none focus:ring-2 focus:ring-orange/50 focus:border-orange"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Description
              </label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-cream focus:outline-none focus:ring-2 focus:ring-orange/50 focus:border-orange resize-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Course
              </label>
              {selectedCourseName ? (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2 bg-navy/5 rounded-lg text-sm font-medium text-navy">
                    {selectedCourseName}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCourseName("");
                      setNewCourseId("");
                    }}
                    className="text-sm text-gray-400 hover:text-red-500"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={courseSearch}
                    onChange={(e) => searchCourses(e.target.value)}
                    placeholder="Search for a course..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-cream focus:outline-none focus:ring-2 focus:ring-orange/50 focus:border-orange"
                  />
                  {courseResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {courseResults.map((c) => (
                        <button
                          key={c.courseId}
                          type="button"
                          onClick={() => {
                            setNewCourseId(String(c.courseId));
                            setSelectedCourseName(
                              `${c.deptCode} ${c.courseNumber} — ${c.courseName}`
                            );
                            setCourseResults([]);
                            setCourseSearch("");
                          }}
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-cream"
                        >
                          <span className="font-medium">
                            {c.deptCode} {c.courseNumber}
                          </span>{" "}
                          — {c.courseName}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Digital or Physical toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Type
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setNewIsDigital(true)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                    newIsDigital
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "border-gray-200 text-gray-500 hover:border-blue-300"
                  }`}
                >
                  Digital
                </button>
                <button
                  type="button"
                  onClick={() => setNewIsDigital(false)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                    !newIsDigital
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "border-gray-200 text-gray-500 hover:border-emerald-300"
                  }`}
                >
                  Physical
                </button>
              </div>
            </div>

            {newIsDigital ? (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  File URL
                </label>
                <input
                  type="url"
                  value={newFileUrl}
                  onChange={(e) => setNewFileUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-cream focus:outline-none focus:ring-2 focus:ring-orange/50 focus:border-orange"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Pickup Location
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="e.g., Rice Hall, Clark Hall"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-cream focus:outline-none focus:ring-2 focus:ring-orange/50 focus:border-orange"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Condition
                  </label>
                  <select
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-cream focus:outline-none focus:ring-2 focus:ring-orange/50 focus:border-orange"
                  >
                    <option>Like New</option>
                    <option>Good</option>
                    <option>Acceptable</option>
                    <option>Fair</option>
                  </select>
                </div>
              </>
            )}

            {formError && (
              <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !newCourseId}
              className="w-full py-3 bg-navy hover:bg-navy-light text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Listing"}
            </button>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <SearchBar
          placeholder="Search listings..."
          onSearch={setSearch}
          className="flex-1"
        />
        <div className="flex gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange/50"
          >
            <option value="">All Types</option>
            <option value="digital">Digital</option>
            <option value="physical">Physical</option>
          </select>
          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange/50"
          >
            <option value="">Any Condition</option>
            <option value="Like New">Like New</option>
            <option value="Good">Good</option>
            <option value="Acceptable">Acceptable</option>
            <option value="Fair">Fair</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange/50"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="title">Title A-Z</option>
            <option value="likes">Most Liked</option>
          </select>
        </div>
      </div>

      {/* Posts grid */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">
          Loading listings...
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          No listings found.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {posts.map((p) => (
            <PostCard key={p.postId} {...p} />
          ))}
        </div>
      )}
    </div>
  );
}
