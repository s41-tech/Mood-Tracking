"use client";

import { useState } from "react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MOOD_META: Record<string, { color: string; hex: string; emoji: string }> = {
  Happy:   { color: "bg-yellow-400", hex: "#facc15", emoji: "😊" },
  Sad:     { color: "bg-blue-400",   hex: "#60a5fa", emoji: "😢" },
  Angry:   { color: "bg-red-500",    hex: "#ef4444", emoji: "😡" },
  Tired:   { color: "bg-gray-400",   hex: "#9ca3af", emoji: "😴" },
  Anxious: { color: "bg-orange-400", hex: "#fb923c", emoji: "😰" },
  Calm:    { color: "bg-cyan-400",   hex: "#22d3ee", emoji: "😌" },
};

function resolveMoods(entry: any): string[] {
  if (!entry) return [];
  if (Array.isArray(entry.moods) && entry.moods.length > 0)
    return entry.moods.map((m: string) => m.charAt(0).toUpperCase() + m.slice(1).toLowerCase());
  const raw = typeof entry.mood === "string" ? entry.mood : entry.mood?.label ?? null;
  if (!raw) return [];
  const label = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  const labels = [label];
  if (entry.mood2) {
    const raw2 = typeof entry.mood2 === "string" ? entry.mood2 : entry.mood2?.label ?? null;
    if (raw2) labels.push(raw2.charAt(0).toUpperCase() + raw2.slice(1).toLowerCase());
  }
  return labels;
}

export default function Calendar({
  moodData,
  onSelectDate,
  filterMood,
}: {
  moodData: Record<string, any>;
  onSelectDate: (date: string) => void;
  filterMood?: string | null;
}) {
  const today = new Date();
  const [current, setCurrent] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });

  const firstDay    = new Date(current.year, current.month, 1).getDay();
  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate();

  const prevMonth = () => setCurrent(c => {
    const d = new Date(c.year, c.month - 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const nextMonth = () => setCurrent(c => {
    const d = new Date(c.year, c.month + 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const formatDate = (day: number) => `${current.year}-${current.month + 1}-${day}`;
  const monthName = new Date(current.year, current.month).toLocaleString("en-US", { month: "long" });

  return (
    <div className="bg-[#1a1a1a] border border-gray-700 rounded-2xl p-6 w-full max-w-lg">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={prevMonth} className="text-gray-400 hover:text-white transition text-xl px-2">‹</button>
        <h2 className="text-white font-bold text-lg">{monthName} {current.year}</h2>
        <button onClick={nextMonth} className="text-gray-400 hover:text-white transition text-xl px-2">›</button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map(d => (
          <div key={d} className="text-center text-gray-500 text-xs font-semibold py-1">{d}</div>
        ))}
      </div>

      {/* Date grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day     = i + 1;
          const dateStr = formatDate(day);
          const entry   = moodData[dateStr];

          const isToday = today.getFullYear() === current.year &&
            today.getMonth() === current.month &&
            today.getDate() === day;

          const moods   = resolveMoods(entry);
          const meta1   = moods[0] ? MOOD_META[moods[0]] : null;
          const meta2   = moods[1] ? MOOD_META[moods[1]] : null;
          const hasMood = !!meta1;
          const hasTags = entry?.tags?.length > 0;

          // ── Filter logic ───────────────────────────────
          const matchesFilter = !filterMood || moods.includes(filterMood);
          const dimmed = filterMood && hasMood && !matchesFilter;

          // ── Cell background ────────────────────────────
          const cellStyle: React.CSSProperties = hasMood && matchesFilter
            ? meta2
              ? { background: `linear-gradient(135deg, ${meta1!.hex} 0%, ${meta2.hex} 100%)` }
              : { background: meta1!.hex }
            : {};

          return (
            <button
              key={day}
              onClick={() => onSelectDate(dateStr)}
              style={hasMood && matchesFilter ? cellStyle : {}}
              className={`
                relative aspect-square flex flex-col items-center justify-center
                rounded-lg text-sm font-medium transition-all duration-200
                ${isToday ? "ring-2 ring-purple-500" : ""}
                ${hasMood && matchesFilter
                  ? "text-white shadow-md hover:brightness-110"
                  : dimmed
                  ? "text-gray-700 bg-gray-900"
                  : hasMood
                  ? "text-white shadow-md hover:brightness-110"
                  : "text-gray-300 hover:bg-gray-700"}
                ${dimmed ? "opacity-25" : ""}
              `}
            >
              <span className="text-xs leading-none drop-shadow-sm">{day}</span>
              {hasMood && !dimmed && (
                <span className="text-[11px] leading-none mt-0.5 drop-shadow">
                  {meta1!.emoji}{meta2 ? meta2.emoji : ""}
                </span>
              )}
              {hasTags && !dimmed && (
                <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-white/70" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}