"use client";

import { useState } from "react";

interface Props {
  placeholder?: string;
  onSearch: (query: string) => void;
  className?: string;
  defaultValue?: string;
}

export default function SearchBar({
  placeholder = "Search...",
  onSearch,
  className = "",
  defaultValue = "",
}: Props) {
  const [value, setValue] = useState(defaultValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(value);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    // Live search on each keystroke
    onSearch(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <svg
        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange shadow-sm transition-all placeholder:text-gray-400"
      />
    </form>
  );
}
