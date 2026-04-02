"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/courses?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="relative">
      {/* Hero section */}
      <div className="relative bg-navy-dark noise-bg overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-navy-light/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative max-w-4xl mx-auto px-4 pt-24 pb-32 text-center">
          <h1 className="font-[Playfair_Display] text-5xl sm:text-7xl font-bold italic text-white mb-4 tracking-tight">
            Re<span className="text-orange">Hoo</span>sed
          </h1>
          <p className="text-white/70 text-lg sm:text-xl mb-12 max-w-xl mx-auto leading-relaxed">
            Find or upload textbooks, study material, and more for any UVA
            course
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto relative">
            <svg
              className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a course..."
              className="w-full pl-14 pr-32 py-4.5 bg-white rounded-2xl text-lg shadow-2xl focus:outline-none focus:ring-4 focus:ring-orange/30 placeholder:text-gray-400"
            />
            <button
              type="submit"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-navy hover:bg-navy-light text-white font-semibold rounded-xl transition-colors text-sm"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Features section */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              ),
              title: "Find Resources",
              desc: "Search through courses and browse textbooks, study guides, lab equipment, and more shared by fellow Hoos.",
            },
            {
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              ),
              title: "Share Your Materials",
              desc: "Post digital files or physical items you no longer need. Help other students while clearing out your shelf.",
            },
            {
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              ),
              title: "Connect & Exchange",
              desc: "Message item owners directly to arrange pickups on Grounds. No middleman, no fees.",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-navy/5 flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-orange"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {feature.icon}
                </svg>
              </div>
              <h3 className="text-lg font-bold text-navy-dark mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
