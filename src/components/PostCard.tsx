"use client";

import Link from "next/link";

interface PostCardProps {
  postId: number;
  title: string;
  description: string;
  createdAt: string;
  sellerUser: string;
  courseName?: string;
  deptCode?: string;
  courseNumber?: string;
  isDigital: number;
  thumbnail: string | null;
  likeCount: number;
  commentCount?: number;
  condition?: string;
  location?: string;
}

export default function PostCard({
  postId,
  title,
  description,
  createdAt,
  sellerUser,
  deptCode,
  courseNumber,
  isDigital,
  thumbnail,
  likeCount,
  commentCount,
  condition,
}: PostCardProps) {
  const date = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link href={`/posts/${postId}`} className="group block">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        {/* Thumbnail */}
        <div className="aspect-[4/3] bg-cream-dark relative overflow-hidden">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg
                className="w-16 h-16 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isDigital ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                )}
              </svg>
            </div>
          )}

          {/* Type badge */}
          <div className="absolute top-3 left-3">
            <span
              className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                isDigital
                  ? "bg-blue-500/90 text-white"
                  : "bg-emerald-500/90 text-white"
              }`}
            >
              {isDigital ? "Digital" : "Physical"}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-navy-dark text-base leading-tight line-clamp-1 group-hover:text-orange transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
            {description}
          </p>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              {deptCode && courseNumber && (
                <span className="bg-navy/5 text-navy px-2 py-0.5 rounded font-medium">
                  {deptCode} {courseNumber}
                </span>
              )}
              {condition && (
                <span className="text-gray-400">{condition}</span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                </svg>
                {likeCount}
              </span>
              {commentCount !== undefined && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {commentCount}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">{sellerUser}</span>
            <span className="text-xs text-gray-400">{date}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
