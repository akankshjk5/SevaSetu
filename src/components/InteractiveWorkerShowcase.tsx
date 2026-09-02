"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { WorkerAvatar } from "./WorkerAvatar";
import type { CategoryId } from "@/lib/types";

export type ShowcaseWorker = {
  id: string;
  name: string;
  photo?: string;
  categories: CategoryId[];
  locality: string;
  experienceYears: number;
  wage: number;
  rating: number;
  jobsCompleted: number;
  verified: boolean;
};

const CATEGORY_TABS: { id: string; label: string; icon: string }[] = [
  { id: "all", label: "All", icon: "✨" },
  { id: "cleaner", label: "Cleaners", icon: "🧹" },
  { id: "cook", label: "Cooks", icon: "🍲" },
  { id: "carpenter", label: "Carpenters", icon: "🪚" },
  { id: "plumber", label: "Plumbers & Mechanics", icon: "🔧" },
  { id: "electrician", label: "Electricians & Appliances", icon: "⚡" },
  { id: "mason", label: "Civil Masons", icon: "🧱" },
  { id: "helper", label: "Site Helpers", icon: "👷" },
  { id: "bar-bender", label: "Bar Benders", icon: "🔩" },
  { id: "painter", label: "Painters", icon: "🎨" },
];

export function InteractiveWorkerShowcase({
  workers,
  city,
}: {
  workers: ShowcaseWorker[];
  city: string;
}) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocality, setSelectedLocality] = useState("all");

  // Localities from workers
  const localities = useMemo(() => {
    const set = new Set(workers.map((w) => w.locality));
    return Array.from(set);
  }, [workers]);

  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      const matchCat =
        activeCategory === "all" || w.categories.includes(activeCategory as CategoryId);
      const matchLoc =
        selectedLocality === "all" || w.locality.toLowerCase() === selectedLocality.toLowerCase();
      const matchQuery =
        !searchQuery.trim() ||
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.locality.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.categories.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchLoc && matchQuery;
    });
  }, [workers, activeCategory, selectedLocality, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Interactive Filter Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? "bg-teal-700 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Area Filter */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search by name or area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 w-full sm:w-44"
          />
          <select
            value={selectedLocality}
            onChange={(e) => setSelectedLocality(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-teal-600 focus:outline-none"
          >
            <option value="all">All Areas</option>
            {localities.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <strong className="text-slate-800">{filteredWorkers.length}</strong> verified helpers in {city}
        </span>
        {(activeCategory !== "all" || selectedLocality !== "all" || searchQuery) && (
          <button
            onClick={() => {
              setActiveCategory("all");
              setSelectedLocality("all");
              setSearchQuery("");
            }}
            className="font-semibold text-teal-700 hover:underline cursor-pointer"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Compact Worker Cards Grid */}
      {filteredWorkers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center bg-white/50">
          <p className="text-xl">🔍</p>
          <p className="mt-2 text-sm font-bold text-slate-700">No helpers matched your filter</p>
          <p className="mt-1 text-xs text-slate-500">Try selecting another trade or clearing the search box.</p>
        </div>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-3">
          {filteredWorkers.map((w) => (
            <div
              key={w.id}
              className="card group flex flex-col justify-between p-3 transition hover:shadow-xs hover:border-teal-400 bg-white"
            >
              <div>
                <div className="flex items-center gap-2.5">
                  <WorkerAvatar
                    id={w.id}
                    name={w.name}
                    trade={w.categories[0]}
                    photo={w.photo}
                    size={42}
                    ring
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-xs sm:text-sm text-slate-900 truncate group-hover:text-teal-800 transition">
                        {w.name}
                      </p>
                      <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-sm">
                        ★ {w.rating.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">
                      {w.locality} · {w.experienceYears}y exp
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="rounded-md bg-teal-50 px-1.5 py-0.5 text-[9px] font-bold text-teal-800 ring-1 ring-teal-200 uppercase tracking-wide">
                        {w.categories[0]}
                      </span>
                      {w.verified && (
                        <span className="text-[10px] font-semibold text-emerald-700">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 rounded-lg bg-slate-50 px-2 py-1.5 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[10px]">{w.jobsCompleted} completed</span>
                  <span className="font-bold text-xs text-slate-900">
                    ₹{w.wage.toLocaleString("en-IN")}
                    <span className="text-[9px] font-normal text-slate-500">
                      {w.wage > 1500 ? "/mo" : "/visit"}
                    </span>
                  </span>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[9px] text-slate-400">🛡️ Free ₹2L insurance</span>
                <Link
                  href={`/login?role=household&next=${encodeURIComponent(
                    `/household/matches?category=${w.categories[0]}`
                  )}`}
                  data-tap
                  className="rounded-lg bg-teal-700 px-2.5 py-1 text-xs font-bold text-white shadow-2xs transition hover:bg-teal-800 active:scale-95 cursor-pointer"
                >
                  Book →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
