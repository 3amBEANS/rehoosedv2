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
    <div className="relative h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      {/* Hero section */}
      <div className="relative bg-navy-dark noise-bg overflow-hidden flex-1 flex items-center">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-navy-light/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative max-w-4xl mx-auto px-4 py-8 text-center w-full">
          <h1 className="font-[Playfair_Display] text-5xl sm:text-7xl font-bold italic text-white mb-4 tracking-tight">
            Re<span className="text-orange">Hoo</span>sed
          </h1>
          <p className="text-white/70 text-lg sm:text-xl mb-8 max-w-xl mx-auto leading-relaxed">
            Find or upload textbooks, study guides, and more for any UVA course
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
    </div>
  );
}
