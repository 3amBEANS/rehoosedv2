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
  location,
}: PostCardProps) {
  const date = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <Link href={`/posts/${postId}`} className="group block">
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-gray-200 hover:shadow-md transition-all duration-200 flex flex-row h-full">
        {/* Left thumbnail */}
        <div className="w-20 h-20 flex-shrink-0 self-center ml-3 my-2 rounded-lg overflow-hidden bg-gray-100">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center ${
                isDigital ? "bg-blue-50" : "bg-emerald-50"
              }`}
            >
              <svg
                className={`w-8 h-8 ${isDigital ? "text-blue-300" : "text-emerald-300"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                {isDigital ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                  />
                )}
              </svg>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 px-4 py-3.5 min-w-0">
          {/* Top row: title + meta */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-[15px] text-navy-dark leading-snug line-clamp-1 group-hover:text-orange transition-colors">
                {title}
              </h3>
              <p className="text-[13px] text-gray-400 mt-0.5 line-clamp-1">
                {description}
              </p>
            </div>
            <span className="text-xs text-gray-300 whitespace-nowrap pt-0.5">
              {date}
            </span>
          </div>

          {/* Bottom row: chips + stats */}
          <div className="flex items-center justify-between mt-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              {deptCode && courseNumber && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide uppercase text-navy bg-navy/[0.06] px-2 py-0.5 rounded-md">
                  {deptCode} {courseNumber}
                </span>
              )}
              <span
                className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md ${
                  isDigital
                    ? "text-blue-600 bg-blue-50"
                    : "text-emerald-600 bg-emerald-50"
                }`}
              >
                {isDigital ? "Digital" : "Physical"}
              </span>
              {condition && (
                <span className="text-[11px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">
                  {condition}
                </span>
              )}
              {location && !isDigital && (
                <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  {location}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-[12px] text-gray-300 flex-shrink-0">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                </svg>
                {likeCount}
              </span>
              {commentCount !== undefined && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
                  </svg>
                  {commentCount}
                </span>
              )}
              <span className="hidden sm:flex items-center gap-1 text-gray-300">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
                {sellerUser}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
