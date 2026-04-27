"use client";

import { Suspense, useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";

interface CourseRow {
  courseId: number;
  courseName: string;
  courseNumber: string;
  deptCode: string;
  deptName: string;
  listingCount: number;
}

interface CoursesResponse {
  courses: CourseRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const PAGE_SIZE = 25;

function CoursesSkeleton() {
  return (
    <div className="space-y-7">
      {[...Array(4)].map((_, i) => (
        <div key={i}>
          <div className="h-3 w-44 bg-gray-200 rounded animate-pulse mb-3" />
          <div className="space-y-1">
            {[...Array(3)].map((_, j) => (
              <div
                key={j}
                className="h-12 bg-white border border-gray-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CoursesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cream">
          <div className="bg-white border-b border-gray-100">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="h-7 w-28 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-40 bg-gray-100 rounded animate-pulse mt-2" />
            </div>
          </div>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="h-[58px] bg-white border border-gray-200 rounded-2xl animate-pulse mb-8" />
            <CoursesSkeleton />
          </div>
        </div>
      }
    >
      <CoursesContent />
    </Suspense>
  );
}

function CoursesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const pageParam = Number(searchParams.get("page") || "1");
  const currentPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [search, setSearch] = useState(query);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  const fetchCourses = useCallback(async (q: string, page: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (q) params.set("q", q);

      const res = await fetch(`/api/courses?${params.toString()}`);
      const text = await res.text();
      if (!res.ok || !text) {
        setCourses([]);
        setTotal(0);
        setTotalPages(1);
        return;
      }
      const data = JSON.parse(text) as CoursesResponse;
      setCourses(Array.isArray(data.courses) ? data.courses : []);
      setTotal(Number(data.pagination?.total || 0));
      setTotalPages(Math.max(Number(data.pagination?.totalPages || 1), 1));
    } catch {
      setCourses([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSearch(query);
    fetchCourses(query, currentPage);
  }, [query, currentPage, fetchCourses]);

  const handleSearch = (q: string) => {
    setSearch(q);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    router.replace(`/courses${params.toString() ? `?${params.toString()}` : ""}`, {
      scroll: false,
    });
  };

  const handlePageChange = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (nextPage > 1) params.set("page", String(nextPage));
    router.replace(`/courses${params.toString() ? `?${params.toString()}` : ""}`, {
      scroll: false,
    });
  };

  const grouped = useMemo(
    () =>
      courses.reduce<Record<string, { deptName: string; courses: CourseRow[] }>>(
        (acc, c) => {
          const key = c.deptCode;
          if (!acc[key]) acc[key] = { deptName: c.deptName, courses: [] };
          acc[key].courses.push(c);
          return acc;
        },
        {},
      ),
    [courses],
  );

  useEffect(() => {
    setOpenMap(
      Object.fromEntries(Object.keys(grouped).map((key) => [key, true])),
    );
  }, [grouped]);

  const startItem = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(currentPage * PAGE_SIZE, total);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (page) =>
      page === 1 ||
      page === totalPages ||
      Math.abs(page - currentPage) <= 1,
  );

  const metaText = loading
    ? "Loading the catalog…"
    : total === 0
      ? query
        ? `Nothing matches “${query}”`
        : "Catalog is empty"
      : `${startItem.toLocaleString()}–${endItem.toLocaleString()} of ${total.toLocaleString()}`;

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-navy-dark tracking-tight">
            Courses
          </h1>
          <p className="text-sm text-gray-400 mt-1 tabular-nums">{metaText}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <SearchBar
          placeholder="Search by course code or title"
          onSearch={handleSearch}
          defaultValue={search}
          className="mb-8"
        />

        {loading ? (
          <CoursesSkeleton />
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <svg
              className="w-12 h-12 text-gray-200 mx-auto mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <p className="text-gray-500 text-sm">
              {search ? (
                <>
                  No courses matched{" "}
                  <span className="font-medium text-navy">
                    {"“"}
                    {search}
                    {"”"}
                  </span>
                </>
              ) : (
                "No courses available right now"
              )}
            </p>
            {search && (
              <button
                onClick={() => handleSearch("")}
                className="mt-3 text-sm text-orange hover:underline font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white rounded"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-7">
            {Object.entries(grouped).map(([deptCode, group]) => (
              <details
                key={deptCode}
                open={openMap[deptCode] ?? true}
                onToggle={(e) => {
                  const isOpen = (e.target as HTMLDetailsElement).open;
                  setOpenMap((prev) => ({
                    ...prev,
                    [deptCode]: isOpen,
                  }));
                }}
                className="group"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none py-2 border-b border-gray-200/80 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream">
                  <span className="text-xs font-bold text-navy uppercase tracking-[0.15em]">
                    {group.deptName}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-[11px] tabular-nums text-gray-400">
                      {group.courses.length}
                    </span>
                    <svg
                      aria-hidden="true"
                      className="w-3.5 h-3.5 text-gray-400 transition-transform duration-200 group-open:rotate-90"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                </summary>
                <ul className="mt-2 space-y-0.5">
                  {group.courses.map((c) => (
                    <li key={c.courseId}>
                      <Link
                        href={`/courses/${c.courseId}`}
                        className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl hover:bg-white hover:shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream group/row"
                      >
                        <span className="flex items-baseline gap-3 min-w-0">
                          <span className="font-semibold text-navy-dark tabular-nums whitespace-nowrap group-hover/row:text-orange transition-colors">
                            {c.deptCode} {c.courseNumber}
                          </span>
                          <span className="text-sm text-gray-500 truncate">
                            {c.courseName}
                          </span>
                        </span>
                        <span
                          className={`text-sm tabular-nums whitespace-nowrap ${
                            c.listingCount === 0
                              ? "text-gray-300"
                              : "text-orange font-medium"
                          }`}
                          aria-label={
                            c.listingCount === 0
                              ? "No listings"
                              : `${c.listingCount} listing${c.listingCount !== 1 ? "s" : ""}`
                          }
                        >
                          {c.listingCount === 0
                            ? "—"
                            : `${c.listingCount} listing${c.listingCount !== 1 ? "s" : ""}`}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            ))}

            {totalPages > 1 && (
              <nav
                aria-label="Course pages"
                className="flex flex-wrap items-center justify-center gap-2 pt-6"
              >
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-navy disabled:opacity-40 disabled:cursor-not-allowed hover:border-orange hover:text-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/40 transition-colors"
                >
                  Previous
                </button>
                {pageNumbers.map((page, index) => {
                  const previousPage = pageNumbers[index - 1];
                  const showGap = previousPage && page - previousPage > 1;

                  return (
                    <div key={page} className="flex items-center gap-2">
                      {showGap && (
                        <span className="text-gray-300" aria-hidden="true">
                          {"…"}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handlePageChange(page)}
                        aria-current={page === currentPage ? "page" : undefined}
                        className={`min-w-11 px-3 py-2.5 rounded-lg border text-sm font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/40 ${
                          page === currentPage
                            ? "border-orange bg-orange text-white"
                            : "border-gray-200 bg-white text-navy hover:border-orange hover:text-orange"
                        }`}
                      >
                        {page}
                      </button>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-navy disabled:opacity-40 disabled:cursor-not-allowed hover:border-orange hover:text-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/40 transition-colors"
                >
                  Next
                </button>
              </nav>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
