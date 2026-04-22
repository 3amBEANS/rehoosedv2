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
    try {
      const res = await fetch(`/api/courses?q=${encodeURIComponent(q)}`);
      const text = await res.text();
      if (!res.ok || !text) {
        setCourses([]);
        return;
      }
      const data = JSON.parse(text) as unknown;
      setCourses(Array.isArray(data) ? (data as CourseRow[]) : []);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
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
    const key = `${c.deptCode} - ${c.deptName}`;
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
        placeholder="Search courses"
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
        </div>
      )}
    </div>
  );
}
