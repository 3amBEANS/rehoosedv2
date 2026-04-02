"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PostCard from "@/components/PostCard";

interface CourseDetail {
  courseId: number;
  courseName: string;
  courseNumber: string;
  deptCode: string;
  deptName: string;
}

interface PostRow {
  postId: number;
  title: string;
  description: string;
  createdAt: string;
  sellerUser: string;
  isDigital: number;
  thumbnail: string | null;
  likeCount: number;
  fileUrl?: string;
  location?: string;
  condition?: string;
}

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [courseRes, userRes] = await Promise.all([
        fetch(`/api/courses/${courseId}`),
        fetch("/api/auth/me"),
      ]);
      if (!courseRes.ok) {
        router.push("/courses");
        return;
      }
      const data = await courseRes.json();
      const userData = await userRes.json();
      setCourse(data.course);
      setPosts(data.posts);
      setCurrentUser(userData.user?.username || null);
      setLoading(false);
    };
    fetchData();
  }, [courseId, router]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center text-gray-400">
        Loading...
      </div>
    );
  }

  if (!course) return null;

  const digitalPosts = posts.filter((p) => p.isDigital);
  const physicalPosts = posts.filter((p) => !p.isDigital);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button
        onClick={() => router.back()}
        className="text-sm text-gray-500 hover:text-navy mb-4 flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="mb-8">
        <span className="text-sm font-semibold text-orange uppercase tracking-wider">
          {course.deptCode} {course.courseNumber}
        </span>
        <h1 className="text-3xl font-bold text-navy-dark mt-1">
          {course.courseName}
        </h1>
        <p className="text-gray-500 mt-1">{course.deptName}</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <span className="text-gray-500">
          {posts.length} resource{posts.length !== 1 ? "s" : ""} available
        </span>
        {currentUser && (
          <button
            onClick={() => router.push(`/posts?new=true&courseId=${courseId}`)}
            className="px-5 py-2.5 bg-orange hover:bg-orange-light text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Add Resource
          </button>
        )}
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <p className="text-gray-400 mb-2">No resources posted yet.</p>
          <p className="text-sm text-gray-400">
            Be the first to share resources for this course!
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {digitalPosts.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-navy-dark mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Digital Resources
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {digitalPosts.map((p) => (
                  <PostCard
                    key={p.postId}
                    {...p}
                    deptCode={course.deptCode}
                    courseNumber={course.courseNumber}
                  />
                ))}
              </div>
            </section>
          )}

          {physicalPosts.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-navy-dark mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Physical Items
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {physicalPosts.map((p) => (
                  <PostCard
                    key={p.postId}
                    {...p}
                    deptCode={course.deptCode}
                    courseNumber={course.courseNumber}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
