// src/components/SearchBar.tsx
import React from "react";
import { COLORS, type Category } from "../types/EventType";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  setTimeFilter: React.Dispatch<React.SetStateAction<0 | 7 | 14 | 21>>;
  categoryFilters: Record<Category, boolean>;
  timeFilter: 0 | 7 | 14 | 21;
  setCategoryFilters: React.Dispatch<
    React.SetStateAction<Record<Category, boolean>>
  >;
}
const SearchBar = ({
  searchQuery,
  setSearchQuery,
  setTimeFilter,
  categoryFilters,
  setCategoryFilters,
  timeFilter,
}: SearchBarProps) => {
  return (
    <div className="mb-4 flex gap-4 items-center">
      <input
        className="border px-2 py-1 rounded w-64"
        placeholder="Search tasks..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <div className="flex gap-2 items-center">
        {(
          [
            "To Do",
            "In Progress",
            "Review",
            "Completed",
            "Overdue",
          ] as Category[]
        ).map((cat) => (
          <label
            key={cat}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <input
              type="checkbox"
              className="appearance-none w-5 h-5 border-2  rounded-md
               checked:bg-blue-100 checked:border-black
               focus:outline-none focus:ring-2 focus:ring-blue-400
               transition duration-200"
              checked={categoryFilters[cat]}
              onChange={(e) =>
                setCategoryFilters((s) => ({
                  ...s,
                  [cat]: e.target.checked,
                }))
              }
            />

            {categoryFilters[cat] && (
              <svg
                className="absolute w-5 h-5 text-black pointer-events-none"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
            <span
              className={`text-sm rounded px-2 py-1 font-medium ${COLORS[cat]} `}
            >
              {cat}
            </span>
          </label>
        ))}
      </div>

      <div className="flex gap-1 items-center">
        <label className="text-sm">Time:</label>
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(Number(e.target.value) as any)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value={0}>All</option>
          <option value={7}>1 week</option>
          <option value={14}>2 weeks</option>
          <option value={21}>3 weeks</option>
        </select>
      </div>
    </div>
  );
};

export default SearchBar;
