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
  const initialQ = searchParams.get("q") || "";
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [search, setSearch] = useState(initialQ);
  const [loading, setLoading] = useState(true);

  const fetchCourses = useCallback(async (q: string) => {
    setLoading(true);
    const res = await fetch(`/api/courses?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setCourses(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCourses(initialQ);
  }, [initialQ, fetchCourses]);

  const handleSearch = (q: string) => {
    setSearch(q);
    router.replace(`/courses?q=${encodeURIComponent(q)}`, { scroll: false });
    fetchCourses(q);
  };

  // Group by department
  const grouped = courses.reduce<Record<string, CourseRow[]>>((acc, c) => {
    const key = `${c.deptCode} — ${c.deptName}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-navy-dark mb-6">
        Browse Courses
      </h1>

      <SearchBar
        placeholder="Search courses (e.g., CS 3240, Biology)"
        onSearch={handleSearch}
        defaultValue={search}
        className="mb-8"
      />

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading courses...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          No courses found for &ldquo;{search}&rdquo;
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([dept, deptCourses]) => (
            <div key={dept}>
              <h2 className="text-sm font-bold text-navy uppercase tracking-wider mb-3 border-b border-gray-200 pb-2">
                {dept}
              </h2>
              <div className="space-y-1">
                {deptCourses.map((c) => (
                  <Link
                    key={c.courseId}
                    href={`/courses/${c.courseId}`}
                    className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-navy/5 flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-navy/50"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                      </div>
                      <div>
                        <span className="font-semibold text-navy-dark group-hover:text-orange transition-colors">
                          {c.deptCode} {c.courseNumber}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          {c.courseName}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span>{c.listingCount} listing{c.listingCount !== 1 ? "s" : ""}</span>
                      <svg
                        className="w-4 h-4"
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
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
