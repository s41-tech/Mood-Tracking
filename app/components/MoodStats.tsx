"use client";

import { useMemo, useState } from "react";

const MOODS = [
  { label: "Happy",   emoji: "😊", color: "#facc15" },
  { label: "Sad",     emoji: "😢", color: "#60a5fa" },
  { label: "Angry",   emoji: "😡", color: "#ef4444" },
  { label: "Tired",   emoji: "😴", color: "#9ca3af" },
  { label: "Anxious", emoji: "😰", color: "#fb923c" },
  { label: "Calm",    emoji: "😌", color: "#22d3ee" },
];

const SCORE: Record<string, number> = {
  Happy: 5, Calm: 4, Tired: 3, Anxious: 2, Sad: 1, Angry: 0,
};

const HEATMAP_SCORE_COLOR: Record<number, string> = {
  5: "#c084fc",
  4: "#a855f7",
  3: "#7c3aed",
  2: "#6d28d9",
  1: "#5b21b6",
  0: "#4c1d95",
};

function resolveMoods(e: any): string[] {
  if (Array.isArray(e.moods) && e.moods.length > 0)
    return e.moods.map((m: string) => m.charAt(0).toUpperCase() + m.slice(1).toLowerCase());
  const raw = typeof e.mood === "string" ? e.mood : e.mood?.label ?? null;
  if (!raw) return [];
  return [raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()];
}

// ── Donut ─────────────────────────────────────────────────
function Donut({ slices, size = 200 }: { slices: { color: string; value: number }[]; size?: number }) {
  const total = slices.reduce((s, d) => s + d.value, 0);
  if (!total) return null;
  const R = size * 0.36, sw = size * 0.13, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * R;
  let off = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#1f2937" strokeWidth={sw} />
      {slices.map((s, i) => {
        const dash = (s.value / total) * circ;
        const rot  = (off / total) * 360 - 90;
        off += s.value;
        return (
          <circle key={i} cx={cx} cy={cy} r={R} fill="none"
            stroke={s.color} strokeWidth={sw}
            strokeDasharray={`${dash} ${circ - dash}`}
            transform={`rotate(${rot} ${cx} ${cy})`}
            className="transition-all duration-500"
          />
        );
      })}
    </svg>
  );
}

// ── Interactive Sparkline with tooltip ───────────────────
function SparklineTooltip({
  values, color, label, dateLabels, moodLabels,
}: {
  values: number[];
  color: string;
  label: string;
  dateLabels?: string[];
  moodLabels?: (string[] | null)[];
}) {
  const [tooltip, setTooltip] = useState<{ idx: number } | null>(null);

  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const W = 260, H = 60, p = 6;
  const pts = values.map((v, i) => {
    const x = p + (i / (values.length - 1)) * (W - p * 2);
    const y = H - p - (v / max) * (H - p * 2);
    return [x, y] as [number, number];
  });
  const pathD = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const ti = tooltip?.idx ?? null;

  return (
    <div className="flex flex-col gap-1">
      {label && <div className="text-xs text-gray-500 font-medium">{label}</div>}
      <div className="relative">
        <svg
          width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible"
          onMouseLeave={() => setTooltip(null)}
        >
          <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" opacity="0.3" />
          <path d={`${pathD} L ${pts[pts.length-1][0]} ${H} L ${pts[0][0]} ${H} Z`} fill={color} opacity="0.08" />
          <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          {ti !== null && (
            <line x1={pts[ti][0]} y1={0} x2={pts[ti][0]} y2={H}
              stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
          )}
          {pts.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y}
              r={ti === i ? 6 : 3.5}
              fill={color} stroke="#1a1a1a" strokeWidth="1.5"
              style={{ cursor: "crosshair", transition: "r 0.1s" }}
              onMouseEnter={() => setTooltip({ idx: i })}
            />
          ))}
        </svg>
        {ti !== null && dateLabels && (
          <div
            className="absolute z-20 pointer-events-none px-2.5 py-1.5 rounded-xl text-xs shadow-2xl border border-gray-700 bg-[#111]"
            style={{
              left: `${(pts[ti][0] / W) * 100}%`,
              bottom: pts[ti][1] < H / 2 ? "auto" : "105%",
              top:    pts[ti][1] < H / 2 ? "105%" : "auto",
              transform: "translateX(-50%)",
              whiteSpace: "nowrap",
            }}
          >
            <div className="text-gray-400 font-semibold">{dateLabels[ti]}</div>
            {moodLabels?.[ti]?.length ? (
              <div className="flex gap-1.5 mt-0.5 flex-wrap">
                {moodLabels[ti]!.map(m => {
                  const meta = MOODS.find(x => x.label === m);
                  return (
                    <span key={m} style={{ color: meta?.color ?? "#aaa" }} className="text-[11px]">
                      {meta?.emoji} {m}
                    </span>
                  );
                })}
              </div>
            ) : (
              <div className="text-gray-600 text-[10px] mt-0.5">No data</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Regular Sparkline (per-mood trends) ──────────────────
function Sparkline({ values, color, label }: { values: number[]; color: string; label: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const W = 260, H = 60, p = 6;
  const pts = values.map((v, i) => {
    const x = p + (i / (values.length - 1)) * (W - p * 2);
    const y = H - p - (v / max) * (H - p * 2);
    return [x, y] as [number, number];
  });
  const pathD = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs text-gray-500 font-medium">{label}</div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full">
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" opacity="0.4" />
        <path d={`${pathD} L ${pts[pts.length-1][0]} ${H} L ${pts[0][0]} ${H} Z`} fill={color} opacity="0.08" />
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3.5" fill={color} stroke="#1a1a1a" strokeWidth="1.5" />
        ))}
      </svg>
    </div>
  );
}

// ── Heatmap ───────────────────────────────────────────────
function Heatmap({ moodData }: { moodData: Record<string, any> }) {
  const weeks = 12, days = weeks * 7;
  const [hovered, setHovered] = useState<{ key: string; label: string; color: string } | null>(null);

  const cells = useMemo(() => {
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
      const key = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
      const entry = moodData[key];
      if (!entry) return { key, color: null, label: "" };
      const moods = resolveMoods(entry);
      const score = moods.length ? Math.max(...moods.map(m => SCORE[m] ?? 2)) : -1;
      const topMood = [...moods].sort((a,b) => (SCORE[b]??0)-(SCORE[a]??0))[0];
      const meta = MOODS.find(m => m.label === topMood);
      return {
        key,
        color: score >= 0 ? (HEATMAP_SCORE_COLOR[score] ?? null) : null,
        label: meta ? `${meta.emoji} ${meta.label}` : "",
      };
    });
  }, [moodData]);

  return (
    <div>
      <div className="flex gap-1 flex-wrap">
        {cells.map((c, i) => (
          <div key={i}
            className="w-4 h-4 rounded-sm transition-all duration-150 hover:scale-125 cursor-default"
            style={{ background: c.color ?? "#1f2937" }}
            onMouseEnter={() => c.color ? setHovered({ key: c.key, label: c.label, color: c.color }) : setHovered(null)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
      </div>
      <div className="h-7 mt-2 flex items-center">
        {hovered ? (
          <div className="flex items-center gap-2 text-xs bg-[#111] border border-gray-700 rounded-lg px-3 py-1.5">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: hovered.color }} />
            <span className="text-gray-500">{hovered.key}</span>
            <span className="text-gray-300">{hovered.label}</span>
          </div>
        ) : (
          <span className="text-[10px] text-gray-600">Hover over a cell to see details</span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-gray-600">No data</span>
        <div className="w-3 h-3 rounded-sm bg-[#1f2937]" />
        <span className="text-[10px] text-gray-600 mx-1">→</span>
        {[0,1,2,3,4,5].map(s => (
          <div key={s} className="flex items-center gap-0.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: HEATMAP_SCORE_COLOR[s] }} />
          </div>
        ))}
        <span className="text-[10px] text-gray-600 ml-1">More positive →</span>
      </div>
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        {[0,1,2,3,4,5].map(s => {
          const mood = Object.entries(SCORE).find(([,v]) => v === s)?.[0];
          const meta = MOODS.find(m => m.label === mood);
          return meta ? (
            <span key={s} className="text-[9px] text-gray-600">{meta.emoji} {meta.label}</span>
          ) : null;
        })}
      </div>
    </div>
  );
}

// ── Month helpers ─────────────────────────────────────────
function getAvailableMonths(moodData: Record<string, any>) {
  const set = new Set<string>();
  Object.keys(moodData).forEach(date => {
    const [y, m] = date.split("-");
    set.add(`${y}-${m.padStart(2,"0")}`);
  });
  return Array.from(set).sort((a,b) => b.localeCompare(a));
}

function monthLabel(ym: string) {
  const [y, m] = ym.split("-");
  return new Date(Number(y), Number(m)-1).toLocaleString("en-US", { month: "long", year: "numeric" });
}

// ═══════════════════════════════════════════════════════════
export default function MoodStats({ moodData }: { moodData: Record<string, any> }) {
  const availableMonths = useMemo(() => getAvailableMonths(moodData), [moodData]);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  const filteredData = useMemo(() => {
    if (selectedMonth === "all") return moodData;
    const [y, m] = selectedMonth.split("-");
    return Object.fromEntries(
      Object.entries(moodData).filter(([date]) => {
        const [dy, dm] = date.split("-");
        return dy === y && dm.padStart(2,"0") === m;
      })
    );
  }, [moodData, selectedMonth]);

  const entries = useMemo(() => Object.entries(filteredData), [filteredData]);
  const total   = entries.length;

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    MOODS.forEach(m => c[m.label] = 0);
    entries.forEach(([, e]) => {
      resolveMoods(e).forEach(label => { c[label] = (c[label] || 0) + 1; });
    });
    return c;
  }, [entries]);

  const tagCounts = useMemo(() => {
    const t: Record<string, number> = {};
    const tagMoods: Record<string, Record<string, number>> = {};
    entries.forEach(([, e]) => {
      const moods = resolveMoods(e);
      (e.tags ?? []).forEach((tag: string) => {
        t[tag] = (t[tag] || 0) + 1;
        if (!tagMoods[tag]) tagMoods[tag] = {};
        moods.forEach(m => { tagMoods[tag][m] = (tagMoods[tag][m] || 0) + 1; });
      });
    });
    return Object.entries(t)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => {
        const topMoodLabel = Object.entries(tagMoods[tag] ?? {}).sort((a,b) => b[1]-a[1])[0]?.[0] ?? null;
        const topMoodMeta = MOODS.find(m => m.label === topMoodLabel);
        return { tag, count, topMoodMeta };
      });
  }, [entries]);

  const { trend30, trend30Dates, trend30Moods } = useMemo(() => {
    const days = selectedMonth === "all" ? 30 : new Date(
      Number(selectedMonth.split("-")[0]), Number(selectedMonth.split("-")[1]), 0
    ).getDate();

    const values: number[] = [];
    const dates: string[]  = [];
    const moods: (string[] | null)[] = [];

    Array.from({ length: days }, (_, i) => {
      let key: string;
      if (selectedMonth === "all") {
        const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
        key = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
        dates.push(`${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`);
      } else {
        const [y, m] = selectedMonth.split("-");
        key = `${y}-${Number(m)}-${i+1}`;
        dates.push(`${i+1}/${Number(m)}/${y}`);
      }
      const e = filteredData[key];
      const m = e ? resolveMoods(e) : null;
      values.push(m?.length ? Math.max(...m.map(x => SCORE[x] ?? 0)) : 0);
      moods.push(m?.length ? m : null);
    });

    return { trend30: values, trend30Dates: dates, trend30Moods: moods };
  }, [filteredData, selectedMonth]);

  const moodTrends = useMemo(() => {
    const days = selectedMonth === "all" ? 14 : new Date(
      Number(selectedMonth.split("-")[0]), Number(selectedMonth.split("-")[1]), 0
    ).getDate();
    return MOODS.map(m => ({
      ...m,
      values: Array.from({ length: days }, (_, i) => {
        let key: string;
        if (selectedMonth === "all") {
          const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
          key = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
        } else {
          const [y, mo] = selectedMonth.split("-");
          key = `${y}-${Number(mo)}-${i+1}`;
        }
        const e = filteredData[key];
        return e && resolveMoods(e).includes(m.label) ? 1 : 0;
      }),
    })).filter(m => m.values.some(v => v > 0));
  }, [filteredData, selectedMonth]);

  const { avgScore, streak } = useMemo(() => {
    const scores = entries.map(([, e]) => {
      const moods = resolveMoods(e);
      return moods.length ? Math.max(...moods.map(m => SCORE[m] ?? 0)) : 0;
    });
    const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "–";
    let s = 0;
    if (selectedMonth === "all") {
      for (let i = 0; ; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
        if (moodData[key]) s++; else break;
      }
    }
    return { avgScore: avg, streak: s };
  }, [entries, selectedMonth]);

  const topMood   = MOODS.reduce((a, b) => counts[a.label] >= counts[b.label] ? a : b);
  const donutData = MOODS.filter(m => counts[m.label] > 0).map(m => ({ color: m.color, value: counts[m.label] }));

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto">

      {/* ── Month Filter ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-gray-500 uppercase tracking-wider">View:</span>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setSelectedMonth("all")}
            className={`text-xs px-4 py-1.5 rounded-full border transition-all duration-200
              ${selectedMonth === "all" ? "bg-purple-600/20 border-purple-500/50 text-purple-300" : "border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-500"}`}>
            All time
          </button>
          {availableMonths.map(ym => (
            <button key={ym} onClick={() => setSelectedMonth(ym)}
              className={`text-xs px-4 py-1.5 rounded-full border transition-all duration-200
                ${selectedMonth === ym ? "bg-purple-600/20 border-purple-500/50 text-purple-300" : "border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-500"}`}>
              {monthLabel(ym)}
            </button>
          ))}
        </div>
      </div>

      {total === 0 ? (
        <div className="text-gray-500 text-sm text-center p-16 bg-[#1a1a1a] rounded-2xl border border-dashed border-gray-700">
          {selectedMonth === "all" ? "No mood data yet. Start tracking your mood!" : "No entries for this month."}
        </div>
      ) : (
        <>
          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { num: total,    label: "Total Entries",  color: "text-purple-400" },
              { num: selectedMonth === "all" ? streak : "–", label: "Day Streak", color: "text-green-400" },
              { num: avgScore, label: "Avg Mood Score",  color: "text-cyan-400"  },
              { num: counts[topMood.label], label: `Most: ${topMood.emoji} ${topMood.label}`, color: "text-yellow-400" },
            ].map(s => (
              <div key={s.label} className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-4 text-center hover:-translate-y-1 transition-transform duration-200">
                <div className={`text-3xl font-bold ${s.color}`}>{s.num}</div>
                <div className="text-gray-500 text-xs mt-1 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── Donut + Freq ── */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Mood Distribution</h3>
              <div className="flex items-center gap-5">
                <Donut slices={donutData} size={140} />
                <div className="flex flex-col gap-2 flex-1">
                  {MOODS.filter(m => counts[m.label] > 0)
                    .sort((a, b) => counts[b.label] - counts[a.label])
                    .map(m => (
                      <div key={m.label} className="flex items-center gap-2 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: m.color }} />
                        <span className="text-gray-300 flex-1">{m.emoji} {m.label}</span>
                        <span className="text-gray-500 font-mono">{counts[m.label]}x</span>
                        <span className="text-gray-600">{Math.round((counts[m.label] / total) * 100)}%</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Frequency</h3>
              <div className="flex flex-col gap-3">
                {MOODS.filter(m => counts[m.label] > 0)
                  .sort((a, b) => counts[b.label] - counts[a.label])
                  .map(m => {
                    const max = Math.max(...MOODS.map(x => counts[x.label]));
                    return (
                      <div key={m.label}>
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>{m.emoji} {m.label}</span>
                          <span className="text-gray-500">{counts[m.label]} / {total}</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${Math.round((counts[m.label] / max) * 100)}%`, background: m.color }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* ── Trend sparkline with tooltip ── */}
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-5">
            <h3 className="text-white font-semibold text-sm mb-1 uppercase tracking-wider">
              {selectedMonth === "all" ? "30-Day Mood Trend" : `Mood Trend — ${monthLabel(selectedMonth)}`}
              <span className="text-gray-600 normal-case font-normal text-xs ml-2">(higher = more positive)</span>
            </h3>
            <p className="text-[10px] text-gray-600 mb-3">Hover over a point to see the date and mood</p>
            <SparklineTooltip
              values={trend30}
              color="#a78bfa"
              label=""
              dateLabels={trend30Dates}
              moodLabels={trend30Moods}
            />
            <div className="flex justify-between text-[10px] text-gray-700 mt-1 px-1">
              <span>{selectedMonth === "all" ? "30 days ago" : "Day 1"}</span>
              <span>{selectedMonth === "all" ? "Today" : "End of month"}</span>
            </div>
          </div>

          {/* ── Per-mood sparklines ── */}
          {moodTrends.length > 0 && (
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">
                Per-Mood Trends
                <span className="text-gray-600 normal-case font-normal text-xs ml-2">
                  {selectedMonth === "all" ? "(last 14 days)" : `(${monthLabel(selectedMonth)})`}
                </span>
              </h3>
              <div className="grid md:grid-cols-2 gap-5">
                {moodTrends.map(m => (
                  <Sparkline key={m.label} values={m.values} color={m.color} label={`${m.emoji} ${m.label}`} />
                ))}
              </div>
            </div>
          )}

          {/* ── 12-week heatmap ── */}
          {selectedMonth === "all" && (
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-5">
              <h3 className="text-white font-semibold text-sm mb-1 uppercase tracking-wider">12-Week Heatmap</h3>
              <p className="text-[10px] text-gray-500 mb-4">Each cell = 1 day — hover to see details</p>
              <Heatmap moodData={moodData} />
            </div>
          )}

          {/* ── Top tags ── */}
          {tagCounts.length > 0 && (
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Top Tags</h3>
              <div className="flex flex-col gap-3">
                {tagCounts.slice(0, 8).map(({ tag, count, topMoodMeta }) => {
                  const max = tagCounts[0].count;
                  return (
                    <div key={tag}>
                      <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-purple-300">#{tag}</span>
                          {topMoodMeta && (
                            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border"
                              style={{ borderColor: topMoodMeta.color + "50", background: topMoodMeta.color + "15", color: topMoodMeta.color }}>
                              {topMoodMeta.emoji} {topMoodMeta.label}
                            </span>
                          )}
                        </div>
                        <span className="text-gray-500">{count}x</span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-purple-500 transition-all duration-700"
                          style={{ width: `${Math.round((count / max) * 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}