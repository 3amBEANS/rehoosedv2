"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
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

export default function CoursesPage() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto px-4 py-20 text-center text-gray-400">Loading...</div>}>
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

  // Group by department
  const grouped = courses.reduce<Record<string, CourseRow[]>>((acc, c) => {
    const key = `${c.deptCode} - ${c.deptName}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  const startItem = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(currentPage * PAGE_SIZE, total);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (page) =>
      page === 1 ||
      page === totalPages ||
      Math.abs(page - currentPage) <= 1
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-navy-dark mb-6">
        Browse Courses
      </h1>

      <SearchBar
        placeholder="Search courses"
        onSearch={handleSearch}
        defaultValue={search}
        className="mb-4"
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8 text-sm text-gray-500">
        <p>
          {loading
            ? "Loading courses..."
            : total === 0
              ? "No courses found"
              : `Showing ${startItem}-${endItem} of ${total} courses`}
        </p>
        {!loading && totalPages > 1 && (
          <p>
            Page {currentPage} of {totalPages}
          </p>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading courses...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          No courses found for &ldquo;{search}&rdquo;
        </div>
      ) : (
        <div className="space-y-2">
          {Object.entries(grouped).map(([dept, deptCourses]) => (
            <details key={dept} className="group border-b border-gray-200 pb-2">
              <summary className="flex items-center justify-between cursor-pointer list-none py-2 text-sm font-bold text-navy uppercase tracking-wider">
                <span>{dept}</span>
                <svg
                  className="w-4 h-4 transition-transform group-open:rotate-90"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </summary>
              <div className="space-y-1 mt-2">
                {deptCourses.map((c) => (
                  <Link
                    key={c.courseId}
                    href={`/courses/${c.courseId}`}
                    className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white hover:shadow-sm transition-all group/row"
                  >
                    <div>
                      <span className="font-semibold text-navy-dark group-hover/row:text-orange transition-colors">
                        {c.deptCode} {c.courseNumber}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        {c.courseName}
                      </span>
                    </div>
                    <span className="text-sm text-gray-400">
                      {c.listingCount} listing{c.listingCount !== 1 ? "s" : ""}
                    </span>
                  </Link>
                ))}
              </div>
            </details>
          ))}
          {totalPages > 1 && (
            <nav
              aria-label="Course pages"
              className="flex flex-wrap items-center justify-center gap-2 pt-4"
            >
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-navy disabled:opacity-40 disabled:cursor-not-allowed hover:border-orange hover:text-orange transition-colors"
              >
                Previous
              </button>
              {pageNumbers.map((page, index) => {
                const previousPage = pageNumbers[index - 1];
                const showGap = previousPage && page - previousPage > 1;

                return (
                  <div key={page} className="flex items-center gap-2">
                    {showGap && <span className="text-gray-300">...</span>}
                    <button
                      type="button"
                      onClick={() => handlePageChange(page)}
                      aria-current={page === currentPage ? "page" : undefined}
                      className={`min-w-10 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
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
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-navy disabled:opacity-40 disabled:cursor-not-allowed hover:border-orange hover:text-orange transition-colors"
              >
                Next
              </button>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}
