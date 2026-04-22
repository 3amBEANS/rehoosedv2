"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import PostCard from "@/components/PostCard";

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
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-400">
          Loading...
        </div>
      }
    >
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
  const [courseResults, setCourseResults] = useState<
    Array<{
      courseId: number;
      courseName: string;
      deptCode: string;
      courseNumber: string;
    }>
  >([]);
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

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("");
    setConditionFilter("");
    setSort("newest");
  };

  const hasFilters = search || typeFilter || conditionFilter || sort !== "newest";

  return (
    <div className="min-h-screen bg-cream">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold text-navy-dark tracking-tight">
                Browse Resources
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                {loading
                  ? "Loading..."
                  : `${posts.length} resource${posts.length !== 1 ? "s" : ""} available`}
              </p>
            </div>
            {currentUser && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 px-5 py-2.5 bg-orange hover:bg-orange-light text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                {showForm ? "Cancel" : "New Listing"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Create post form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
            <h2 className="text-base font-bold text-navy-dark mb-4">
              Create a New Listing
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., Calculus Textbook - 10th Edition"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange placeholder:text-gray-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Course
                  </label>
                  {selectedCourseName ? (
                    <div className="flex items-center gap-2 h-[42px]">
                      <span className="px-3 py-1.5 bg-navy/[0.06] rounded-lg text-sm font-medium text-navy">
                        {selectedCourseName}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCourseName("");
                          setNewCourseId("");
                        }}
                        className="text-xs text-gray-400 hover:text-red-500"
                      >
                        change
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={courseSearch}
                        onChange={(e) => searchCourses(e.target.value)}
                        placeholder="Search for a course..."
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange placeholder:text-gray-300"
                      />
                      {courseResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
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
                              className="block w-full text-left px-3.5 py-2 text-sm hover:bg-cream transition-colors"
                            >
                              <span className="font-semibold text-navy">
                                {c.deptCode} {c.courseNumber}
                              </span>{" "}
                              <span className="text-gray-500">
                                — {c.courseName}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={2}
                  placeholder="Describe your resource..."
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange resize-none placeholder:text-gray-300"
                  required
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                {/* Type toggle */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Type
                  </label>
                  <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setNewIsDigital(true)}
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${
                        newIsDigital
                          ? "bg-blue-500 text-white"
                          : "bg-white text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      Digital
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewIsDigital(false)}
                      className={`flex-1 py-2 text-sm font-medium transition-colors border-l border-gray-200 ${
                        !newIsDigital
                          ? "bg-emerald-500 text-white"
                          : "bg-white text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      Physical
                    </button>
                  </div>
                </div>

                {newIsDigital ? (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      File URL
                    </label>
                    <input
                      type="url"
                      value={newFileUrl}
                      onChange={(e) => setNewFileUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange placeholder:text-gray-300"
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Pickup Location
                      </label>
                      <input
                        type="text"
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        placeholder="e.g., Rice Hall"
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange placeholder:text-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Condition
                      </label>
                      <select
                        value={newCondition}
                        onChange={(e) => setNewCondition(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange"
                      >
                        <option>Like New</option>
                        <option>Good</option>
                        <option>Acceptable</option>
                        <option>Fair</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              {formError && (
                <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || !newCourseId}
                className="px-8 py-2.5 bg-navy hover:bg-navy-light text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-40"
              >
                {submitting ? "Creating..." : "Publish Listing"}
              </button>
            </form>
          </div>
        )}

        {/* Main content area: sidebar + results */}
        <div className="flex gap-6">
          {/* Sidebar filters */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Filters
                </h2>
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-[11px] text-orange hover:underline font-medium"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Type filter */}
              <div className="mb-5">
                <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Type
                </h3>
                <div className="space-y-1">
                  {[
                    { value: "", label: "All" },
                    { value: "digital", label: "Digital" },
                    { value: "physical", label: "Physical" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTypeFilter(opt.value)}
                      className={`block w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                        typeFilter === opt.value
                          ? "bg-navy/[0.07] text-navy font-medium"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Condition filter */}
              <div className="mb-5">
                <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Condition
                </h3>
                <div className="space-y-1">
                  {[
                    { value: "", label: "Any" },
                    { value: "Like New", label: "Like New" },
                    { value: "Good", label: "Good" },
                    { value: "Acceptable", label: "Acceptable" },
                    { value: "Fair", label: "Fair" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setConditionFilter(opt.value)}
                      className={`block w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                        conditionFilter === opt.value
                          ? "bg-navy/[0.07] text-navy font-medium"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div>
                <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Sort by
                </h3>
                <div className="space-y-1">
                  {[
                    { value: "newest", label: "Newest first" },
                    { value: "oldest", label: "Oldest first" },
                    { value: "title", label: "Title A-Z" },
                    { value: "likes", label: "Most liked" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSort(opt.value)}
                      className={`block w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                        sort === opt.value
                          ? "bg-navy/[0.07] text-navy font-medium"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Search bar + mobile sort */}
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title or description..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange placeholder:text-gray-300"
                />
              </div>
              {/* Mobile filters */}
              <div className="flex lg:hidden gap-2">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm"
                >
                  <option value="">Type</option>
                  <option value="digital">Digital</option>
                  <option value="physical">Physical</option>
                </select>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="title">A-Z</option>
                  <option value="likes">Popular</option>
                </select>
              </div>
            </div>

            {/* Active filter chips */}
            {hasFilters && (
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {search && (
                  <span className="inline-flex items-center gap-1 text-xs bg-white border border-gray-200 text-gray-600 px-2.5 py-1 rounded-full">
                    &ldquo;{search}&rdquo;
                    <button
                      onClick={() => setSearch("")}
                      className="text-gray-400 hover:text-red-500"
                    >
                      &times;
                    </button>
                  </span>
                )}
                {typeFilter && (
                  <span className="inline-flex items-center gap-1 text-xs bg-white border border-gray-200 text-gray-600 px-2.5 py-1 rounded-full">
                    {typeFilter}
                    <button
                      onClick={() => setTypeFilter("")}
                      className="text-gray-400 hover:text-red-500"
                    >
                      &times;
                    </button>
                  </span>
                )}
                {conditionFilter && (
                  <span className="inline-flex items-center gap-1 text-xs bg-white border border-gray-200 text-gray-600 px-2.5 py-1 rounded-full">
                    {conditionFilter}
                    <button
                      onClick={() => setConditionFilter("")}
                      className="text-gray-400 hover:text-red-500"
                    >
                      &times;
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Listings */}
            {loading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl border border-gray-100 h-[76px] animate-pulse"
                  />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                <svg
                  className="w-12 h-12 text-gray-200 mx-auto mb-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p className="text-gray-400 text-sm">No resources found</p>
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-2 text-sm text-orange hover:underline font-medium"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {posts.map((p) => (
                  <PostCard key={p.postId} {...p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
