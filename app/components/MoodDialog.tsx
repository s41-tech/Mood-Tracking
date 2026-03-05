"use client";

import { useState, useMemo } from "react";

// ─── Mood config (export ให้ Calendar และ Dashboard ใช้ร่วม) ──
export const MOODS = [
  { emoji: "😊", label: "Happy",   color: "bg-yellow-400", hex: "#facc15" },
  { emoji: "😢", label: "Sad",     color: "bg-blue-400",   hex: "#60a5fa" },
  { emoji: "😡", label: "Angry",   color: "bg-red-500",    hex: "#ef4444" },
  { emoji: "😴", label: "Tired",   color: "bg-gray-400",   hex: "#9ca3af" },
  { emoji: "😰", label: "Anxious", color: "bg-orange-400", hex: "#fb923c" },
  { emoji: "😌", label: "Calm",    color: "bg-cyan-400",   hex: "#22d3ee" },
];

// ─── Preset tags ──────────────────────────────────────────
const PRESET_TAGS = [
  "work", "family", "social", "exercise", "sleep",
  "food", "weather", "health", "creative", "travel",
  "study", "music", "nature", "relax",
];

// ─── Blend two hex colors 50/50 ───────────────────────────
export function blendHex(a: string, b: string): string {
  const parse = (h: string, pos: number) => parseInt(h.slice(pos, pos + 2), 16);
  const mix = (x: number, y: number) => Math.round((x + y) / 2).toString(16).padStart(2, "0");
  return `#${mix(parse(a,1),parse(b,1))}${mix(parse(a,3),parse(b,3))}${mix(parse(a,5),parse(b,5))}`;
}

// ─── Get gradient/solid style for a moods array ───────────
export function getMoodStyle(moods: string[]): React.CSSProperties {
  if (!moods?.length) return { background: "#1f2937" };
  const hexes = moods.map(l => MOODS.find(m => m.label === l)?.hex ?? "#6b7280");
  if (hexes.length === 1) return { background: hexes[0] };
  return { background: `linear-gradient(135deg, ${hexes[0]} 0%, ${hexes[1]} 100%)` };
}

// ─── Types ────────────────────────────────────────────────
export interface MoodEntry {
  moods: string[];   // 1–2 labels
  note?: string;
  tags?: string[];
  createdAt?: string;
}

interface Props {
  date: string;
  existingData?: MoodEntry | null;
  onClose: () => void;
  onSave: (data: { date: string } & MoodEntry) => void;
  onDelete: (date: string) => void;
}

// ═══════════════════════════════════════════════════════════
export default function MoodDialog({ date, existingData, onClose, onSave, onDelete }: Props) {

  const [selected,  setSelected]  = useState<string[]>(existingData?.moods ?? []);
  const [note,      setNote]      = useState(existingData?.note ?? "");
  const [tags,      setTags]      = useState<string[]>(existingData?.tags ?? []);
  const [customTag, setCustomTag] = useState("");

  const isEditing = !!existingData;

  // ── Toggle mood (max 2, replace oldest) ──────────────────
  const toggleMood = (label: string) => {
    setSelected(prev => {
      if (prev.includes(label)) return prev.filter(l => l !== label);
      if (prev.length >= 2)     return [prev[1], label];
      return [...prev, label];
    });
  };

  // ── Toggle preset tag ─────────────────────────────────────
  const toggleTag = (tag: string) =>
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  // ── Add custom tag ────────────────────────────────────────
  const addCustomTag = () => {
    const t = customTag.trim().toLowerCase().replace(/\s+/g, "-");
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setCustomTag("");
  };

  // ── Blend preview ─────────────────────────────────────────
  const previewStyle = useMemo(() => getMoodStyle(selected), [selected]);

  const blendedHex = useMemo(() => {
    if (selected.length === 2) {
  const a = MOODS.find(m => m.label === selected[0])?.hex;
  const b = MOODS.find(m => m.label === selected[1])?.hex;
    if (a && b) return blendHex(a, b);
      return a ?? b ?? null;
    }
    return selected.length === 1 ? (MOODS.find(m => m.label === selected[0])?.hex ?? null) : null;
  }, [selected]);

  // ── Save ──────────────────────────────────────────────────
  const handleSave = () => {
    if (!selected.length) return;
    onSave({ date, moods: selected, note, tags });
    onClose();
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-[#1a1a1a] border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md flex flex-col gap-5 p-6 max-h-[90vh] overflow-y-auto">

        {/* ── Header ── */}
        <div>
          <h2 className="text-white text-xl font-bold">
            {isEditing ? "Edit your mood" : "How are you feeling?"}
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">{date}</p>
          <p className="text-gray-600 text-xs mt-1">
            Pick up to <span className="text-purple-400 font-medium">2 moods</span> — they blend into your day's color
          </p>
        </div>

        {/* ── Blend preview bar ── */}
        <div
          className="rounded-xl h-12 flex items-center justify-center gap-2 transition-all duration-500 border border-white/10"
          style={selected.length ? previewStyle : { background: "#111" }}
        >
          {selected.length === 0 && (
            <span className="text-gray-600 text-xs">Select a mood below</span>
          )}
          {selected.map(l => {
            const m = MOODS.find(x => x.label === l)!;
            return <span key={l} className="text-2xl drop-shadow">{m.emoji}</span>;
          })}
          {selected.length === 2 && (
            <span className="text-[11px] text-white/60 drop-shadow ml-1">
              {selected[0]} × {selected[1]}
            </span>
          )}
        </div>

        {/* ── Mood grid ── */}
        <div className="grid grid-cols-3 gap-2">
          {MOODS.map(m => {
            const isActive = selected.includes(m.label);
            const order    = selected.indexOf(m.label) + 1;
            return (
              <button
                key={m.label}
                onClick={() => toggleMood(m.label)}
                className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200
                  ${isActive
                    ? "border-purple-500 bg-purple-900/30 scale-105 shadow-lg"
                    : "border-transparent bg-[#111] hover:border-gray-600"}`}
              >
                {isActive && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-purple-500 text-white text-[9px] flex items-center justify-center font-bold leading-none">
                    {order}
                  </span>
                )}
                <span className="text-2xl">{m.emoji}</span>
                <span className={`text-[10px] text-white px-2 py-0.5 rounded-full font-medium ${m.color}`}>
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Tags ── */}
        <div>
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Tags</p>

          {/* Preset tags */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {PRESET_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`text-xs px-3 py-1 rounded-full border transition-all duration-150
                  ${tags.includes(tag)
                    ? "border-purple-500 bg-purple-500/20 text-purple-300"
                    : "border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300"}`}
              >
                #{tag}
              </button>
            ))}
          </div>

          {/* Custom tags added by user */}
          {tags.filter(t => !PRESET_TAGS.includes(t)).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.filter(t => !PRESET_TAGS.includes(t)).map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className="text-xs px-3 py-1 rounded-full border border-cyan-500/50 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition"
                >
                  #{tag} ×
                </button>
              ))}
            </div>
          )}

          {/* Custom tag input */}
          <div className="flex gap-2 mt-1">
            <input
              value={customTag}
              onChange={e => setCustomTag(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomTag(); }}}
              placeholder="Add custom tag..."
              className="flex-1 bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition"
            />
            <button
              onClick={addCustomTag}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition"
            >
              + Add
            </button>
          </div>
        </div>

        {/* ── Note ── */}
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Write a short note... (optional)"
          rows={2}
          className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg p-3 text-white placeholder-gray-600 text-sm resize-none focus:outline-none focus:border-purple-500 transition"
        />

        {/* ── Action buttons ── */}
        <div className="flex justify-between items-center">
          {isEditing ? (
            <button
              onClick={() => { onDelete(date); onClose(); }}
              className="px-4 py-2 rounded-full bg-red-600/15 hover:bg-red-600/30 border border-red-600/30 text-red-400 text-sm transition"
            >
              🗑 Delete
            </button>
          ) : <div />}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white text-sm transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={selected.length === 0}
              className="px-5 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition disabled:opacity-40"
              style={blendedHex ? { boxShadow: `0 0 18px ${blendedHex}66` } : {}}
            >
              {isEditing ? "Update" : "Save"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}