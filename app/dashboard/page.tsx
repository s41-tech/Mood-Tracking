"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { db } from "../pages/firebase";
import { loadAuthState } from "../pages/Auth";
import Calendar from "../components/Calendar";
import MoodDialog, { MOODS, getMoodStyle, blendHex, type MoodEntry } from "../components/MoodDialog";
import { ref, set, get, remove } from "firebase/database";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOutAlt, faHome, faChartBar, faBrain, faBook } from "@fortawesome/free-solid-svg-icons";
import ProfileModal from "../components/ProfileModal";
import MoodStats from "../components/MoodStats";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard",  icon: faHome     },
  { key: "analytics", label: "Analytics",  icon: faChartBar },
  { key: "vibe",      label: "Insights",   icon: faBrain    },
  { key: "journal",   label: "Journal",    icon: faBook     },
];

const getMoodMeta = (label: string) => MOODS.find(m => m.label === label);
const today = new Date();
const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

const TIPS: Record<string, { title: string; tips: string[] }> = {
  Happy:   { title: "😊 You're feeling happy!",  tips: ["Write down the good things that happened today", "Share your joy with someone you care about", "Use this positive energy to tackle something you've been putting off"] },
  Sad:     { title: "😢 You're feeling sad",      tips: ["Talk to someone you trust", "Listen to music you love or watch a light-hearted show", "Give yourself time to rest and recover"] },
  Angry:   { title: "😡 You're feeling angry",    tips: ["Take 5 deep breaths before making any decisions", "Exercise to release built-up energy", "Write your feelings down on paper"] },
  Tired:   { title: "😴 You're feeling tired",    tips: ["Aim for 7–8 hours of quality sleep tonight", "Cut out tasks that aren't essential right now", "Stay hydrated throughout the day"] },
  Anxious: { title: "😰 You're feeling anxious",  tips: ["Write out your worries and tackle them one by one", "Try the 4-7-8 breathing exercise", "Focus only on what you can control"] },
  Calm:    { title: "😌 You're feeling calm",     tips: ["Use this time to plan your goals", "Try meditation or journaling", "Enjoy a creative activity you love"] },
};

const QUOTES: Record<string, string[]> = {
  Happy:   ["Happiness is not a destination — it lives in every step you take 🌟", "Your smile is the most powerful energy you carry", "A good day today means a better tomorrow"],
  Sad:     ["After every storm, the sun always finds a way through 🌤️", "Sadness is just a season, not forever", "You are stronger than you know — give yourself time to heal"],
  Angry:   ["Forgiveness is not for others — it's a gift you give yourself", "Even the fiercest storm eventually passes 🌊", "Staying calm is the truest strength"],
  Tired:   ["Rest is the best investment you can make 💤", "Slow is fine — just don't stop", "A rested body is where every success begins"],
  Anxious: ["Every problem has a solution — you just haven't found it yet 🔍", "Breathe. Let go. One step at a time", "Worry less, live more"],
  Calm:    ["A peaceful mind is the greatest treasure ☮️", "Inner calm creates outer strength", "Calm today means ready for tomorrow"],
};

// ── Welcome Modal ─────────────────────────────────────────
function WelcomeMoodModal({ userName, isNewUser, onGoToJournal, onDismiss }: {
  userName: string; isNewUser: boolean;
  onGoToJournal: () => void; onDismiss: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => { const t = setTimeout(() => setVisible(true), 100); return () => clearTimeout(t); }, []);

  const handleAction = (go: boolean) => {
    setLeaving(true);
    setTimeout(() => { if (go) onGoToJournal(); else onDismiss(); }, 350);
  };

  const floatStyle = (delay: number): React.CSSProperties => ({
    display: "inline-block",
    animation: `wmmFloat 2.4s ease-in-out ${delay}s infinite alternate`,
  });

  return (
    <>
      <style>{`
        @keyframes wmmFloat { from{transform:translateY(0px)} to{transform:translateY(-7px)} }
        @keyframes wmmFadeIn { from{opacity:0;transform:translateY(20px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        .wmm-card { animation: wmmFadeIn 0.42s cubic-bezier(0.34,1.46,0.64,1) forwards; }
      `}</style>
      <div onClick={() => handleAction(false)} style={{
        position:"fixed",inset:0,zIndex:9000,background:"rgba(5,3,14,0.80)",
        backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",
        transition:"opacity 0.35s ease",opacity: leaving ? 0 : 1,padding:"16px",
      }}>
        <div className="wmm-card" onClick={e => e.stopPropagation()} style={{
          background:"linear-gradient(150deg,#1c1033 0%,#110c24 100%)",
          border:"1px solid rgba(139,92,246,0.30)",borderRadius:"28px",
          padding:"clamp(28px,5vw,48px) clamp(20px,5vw,44px) clamp(24px,4vw,40px)",
          maxWidth:"400px",width:"100%",
          boxShadow:"0 0 80px rgba(139,92,246,0.15),0 32px 80px rgba(0,0,0,0.65)",
          textAlign:"center",position:"relative",overflow:"hidden",
          opacity: leaving ? 0 : 1,transition:"opacity 0.35s ease",
        }}>
          <div style={{position:"absolute",top:"-80px",left:"50%",transform:"translateX(-50%)",width:"300px",height:"200px",background:"radial-gradient(ellipse,rgba(139,92,246,0.20) 0%,transparent 70%)",pointerEvents:"none"}} />
          <div style={{marginBottom:"24px",lineHeight:1}}>
            <span style={{fontSize:"clamp(40px,8vw,52px)",...floatStyle(0)}}>😊</span>
            <span style={{fontSize:"clamp(20px,4vw,26px)",opacity:0.5,marginLeft:"6px",...floatStyle(0.2)}}>😢</span>
            <span style={{fontSize:"clamp(20px,4vw,26px)",opacity:0.5,marginLeft:"4px",...floatStyle(0.4)}}>😤</span>
            <span style={{fontSize:"clamp(20px,4vw,26px)",opacity:0.5,marginLeft:"4px",...floatStyle(0.6)}}>😴</span>
          </div>
          <p style={{margin:"0 0 6px",fontSize:"12px",color:"#a78bfa",fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase"}}>
            {isNewUser ? "Welcome to your Mood Journal! 🌟" : "Welcome back 👋"}
          </p>
          <h2 style={{margin:"0 0 14px",fontSize:"clamp(18px,4vw,24px)",fontWeight:800,color:"#f3f0ff",lineHeight:1.3}}>
            {isNewUser ? `Hey, ${userName}! 🎉` : userName}
          </h2>
          <p style={{margin:"0 0 28px",fontSize:"clamp(14px,3vw,16px)",color:"#c4b5fd",lineHeight:1.65}}>
            Ready to log how you're feeling<br /><strong style={{color:"#e9d5ff"}}>today? ✨</strong>
          </p>
          <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
            <button onClick={() => handleAction(true)} style={{width:"100%",padding:"13px 0",borderRadius:"16px",border:"none",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",color:"#fff",fontSize:"15px",fontWeight:700,cursor:"pointer",boxShadow:"0 8px 24px rgba(124,58,237,0.35)"}}>
              ✦ Yes, let's log it!
            </button>
            <button onClick={() => handleAction(false)} style={{width:"100%",padding:"12px 0",borderRadius:"16px",border:"1px solid rgba(139,92,246,0.25)",background:"transparent",color:"#9ca3af",fontSize:"14px",cursor:"pointer"}}>
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Charts ────────────────────────────────────────────────
function DonutChart({ slices }: { slices: { value: number; color: string }[] }) {
  const total = slices.reduce((s, d) => s + d.value, 0);
  if (!total) return <div className="w-24 h-24 rounded-full border-4 border-gray-800 flex items-center justify-center text-gray-600 text-xs">No data</div>;
  const R = 46, cx = 56, cy = 56, sw = 18, circ = 2 * Math.PI * R;
  let off = 0;
  return (
    <svg width={112} height={112} viewBox="0 0 112 112" className="flex-shrink-0">
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#1f2937" strokeWidth={sw} />
      {slices.map((s, i) => {
        const dash = (s.value / total) * circ;
        const rot  = (off / total) * 360 - 90;
        off += s.value;
        return <circle key={i} cx={cx} cy={cy} r={R} fill="none" stroke={s.color} strokeWidth={sw}
          strokeDasharray={`${dash} ${circ - dash}`} transform={`rotate(${rot} ${cx} ${cy})`} />;
      })}
    </svg>
  );
}

function Sparkline({ values, color = "#a78bfa" }: { values: number[]; color?: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const W = 200, H = 44, p = 4;
  const pts = values.map((v, i) => {
    const x = p + (i / (values.length - 1)) * (W - p * 2);
    const y = H - p - (v / max) * (H - p * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {values.map((v, i) => {
        const x = p + (i / (values.length - 1)) * (W - p * 2);
        const y = H - p - (v / max) * (H - p * 2);
        return <circle key={i} cx={x} cy={y} r="3" fill={color} />;
      })}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════
export default function Dashboard() {
  const router = useRouter();
  const [user,             setUser]             = useState<any>(null);
  const [moodData,         setMoodData]         = useState<Record<string, MoodEntry>>({});
  const [selectedDate,     setSelectedDate]     = useState<string | null>(null);
  const [showProfile,      setShowProfile]      = useState(false);
  const [activeNav,        setActiveNav]        = useState("dashboard");
  const [showWelcome,      setShowWelcome]      = useState(false);
  const [isNewUser,        setIsNewUser]        = useState(false);
  const [filterMood,       setFilterMood]       = useState<string | null>(null);
  const [journalSearch,    setJournalSearch]    = useState("");
  const [journalTagFilter, setJournalTagFilter] = useState<string | null>(null);

  useEffect(() => {
    const u = loadAuthState();
    if (!u) { router.push("/"); return; }
    setUser(u);
    loadMoods(u.uid);
    const newUser = sessionStorage.getItem("isNewUser") === "true";
    setIsNewUser(newUser);
    sessionStorage.removeItem("isNewUser");
    setShowWelcome(true);
  }, []);

  const loadMoods = async (uid: string) => {
    const snap = await get(ref(db, `users/${uid}/moods`));
    if (snap.exists()) setMoodData(snap.val());
    const photoSnap = await get(ref(db, `users/${uid}/profile/photoBase64`));
    if (photoSnap.exists()) setUser((prev: any) => ({ ...prev, photoURL: photoSnap.val() }));
  };

  const handleSave = async ({ date, moods, note, tags }: any) => {
    const entry: MoodEntry = { moods, note, tags, createdAt: new Date().toISOString() };
    await set(ref(db, `users/${user.uid}/moods/${date}`), entry);
    setMoodData(prev => ({ ...prev, [date]: entry }));
  };

  const handleDelete = async (date: string) => {
    await remove(ref(db, `users/${user.uid}/moods/${date}`));
    setMoodData(prev => { const u = { ...prev }; delete u[date]; return u; });
  };

  const handleLogout = () => { localStorage.removeItem("authUser"); router.push("/"); };

  const normalize = (e: any): MoodEntry => {
    let moods: string[] = [];
    if (Array.isArray(e.moods) && e.moods.length > 0)
      moods = e.moods.map((m: string) => m.charAt(0).toUpperCase() + m.slice(1).toLowerCase());
    else if (e.mood) {
      const raw = typeof e.mood === "string" ? e.mood : e.mood?.label ?? "";
      moods = [raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()];
    }
    return { ...e, moods, tags: Array.isArray(e.tags) ? e.tags : [], note: e.note ?? "" };
  };

  const stats = useMemo(() => {
    const entries = Object.values(moodData).map(normalize);
    const total = entries.length;
    const counts: Record<string, number> = {};
    for (const e of entries) for (const m of e.moods) counts[m] = (counts[m] || 0) + 1;
    const topMood = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const happyCount = counts["Happy"] ?? 0;
    const slices = Object.entries(counts).map(([label, value]) => ({ label, value, color: getMoodMeta(label)?.hex ?? "#6b7280" }));
    const SCORE: Record<string, number> = { Happy:5, Calm:4, Tired:3, Anxious:2, Sad:1, Angry:0 };
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const key = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
      const e = moodData[key] ? normalize(moodData[key]) : null;
      return e ? Math.max(...e.moods.map(m => SCORE[m] ?? 2)) : 0;
    });
    const tagCounts: Record<string, number> = {};
    for (const e of entries) for (const t of (e.tags ?? [])) tagCounts[t] = (tagCounts[t] || 0) + 1;
    const topTags = Object.entries(tagCounts).sort((a,b) => b[1]-a[1]).slice(0, 5);
    return { total, counts, topMood, happyCount, slices, last7, topTags };
  }, [moodData]);

  const allTags = useMemo(() => {
    const t = new Set<string>();
    Object.values(moodData).forEach((e: any) => (e.tags ?? []).forEach((tag: string) => t.add(tag)));
    return Array.from(t);
  }, [moodData]);

  const journalEntries = useMemo(() => {
    return Object.entries(moodData)
      .sort((a, b) => new Date(b[1].createdAt ?? 0).getTime() - new Date(a[1].createdAt ?? 0).getTime())
      .map(([date, raw]) => ({ date, entry: normalize(raw) }))
      .filter(({ date, entry }) => {
        const matchSearch = !journalSearch ||
          date.includes(journalSearch) ||
          entry.moods.some((m: string) => m.toLowerCase().includes(journalSearch.toLowerCase())) ||
          entry.note?.toLowerCase().includes(journalSearch.toLowerCase()) ||
          entry.tags?.some((t: string) => t.toLowerCase().includes(journalSearch.toLowerCase()));
        const matchTag = !journalTagFilter || entry.tags?.includes(journalTagFilter);
        return matchSearch && matchTag;
      });
  }, [moodData, journalSearch, journalTagFilter]);

  if (!user) return null;

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white flex flex-col">

      {showWelcome && (
        <WelcomeMoodModal
          userName={user.displayName}
          isNewUser={isNewUser}
          onGoToJournal={() => { setShowWelcome(false); setActiveNav("journal"); setSelectedDate(todayKey); }}
          onDismiss={() => setShowWelcome(false)}
        />
      )}

      {/* ── Header ── */}
      <header className="bg-[#1a1a1a] border-b border-gray-800 sticky top-0 z-50">
        <nav className="px-3 sm:px-6 py-3 flex items-center gap-2 sm:gap-4">
          <Image src="/logo.png" alt="Logo" width={36} height={36} className="filter brightness-110 flex-shrink-0 sm:w-11 sm:h-11" />
          <span className="text-base sm:text-xl font-bold text-purple-400 truncate">
            <span className="hidden sm:inline">Mood Tracking Journal</span>
            <span className="sm:hidden">Mood Journal</span>
          </span>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {/* Avatar */}
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold cursor-pointer ring-2 ring-purple-500/30 hover:ring-purple-400/60 transition overflow-hidden flex-shrink-0"
              onClick={() => setShowProfile(true)}
            >
              {user.photoURL
                ? <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                : user.displayName?.charAt(0).toUpperCase()}
            </div>
            <span className="text-gray-400 text-sm cursor-pointer hover:text-white transition hidden lg:block" onClick={() => setShowProfile(true)}>
              Welcome, {user.displayName}
            </span>
            {/* Logout: icon only on mobile */}
            <button onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm font-bold py-1.5 px-2 sm:py-2 sm:px-4 rounded-full transition flex-shrink-0">
              <FontAwesomeIcon icon={faSignOutAlt} className="sm:mr-2" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </nav>
      </header>

      <div className="flex flex-1 pb-16 md:pb-0">

        {/* ── Desktop Sidebar ── */}
        <aside className="hidden md:flex flex-col w-48 lg:w-52 bg-[#111118] border-r border-gray-800/60 py-6 gap-1 sticky top-[57px] h-[calc(100vh-57px)]">
          {NAV_ITEMS.map(item => (
            <button key={item.key} onClick={() => setActiveNav(item.key)}
              className={`flex items-center gap-3 px-4 lg:px-5 py-3 mx-2 rounded-xl text-sm font-medium transition-all duration-200
                ${activeNav === item.key
                  ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                  : "text-gray-500 hover:text-gray-200 hover:bg-white/5"}`}>
              <FontAwesomeIcon icon={item.icon} className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </aside>

        {/* ── Mobile Bottom Nav ── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#111118] border-t border-gray-800/60 flex">
          {NAV_ITEMS.map(item => (
            <button key={item.key} onClick={() => setActiveNav(item.key)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-all duration-200
                ${activeNav === item.key ? "text-purple-300" : "text-gray-600"}`}>
              <FontAwesomeIcon icon={item.icon} className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* ── Main Content ── */}
        <main className="flex-1 py-6 sm:py-10 px-3 sm:px-5 md:px-6 lg:px-8 flex flex-col gap-6 sm:gap-8 min-w-0 overflow-x-hidden">

          {/* ════ DASHBOARD ════ */}
          {activeNav === "dashboard" && (
            <>
              <h1 className="text-xl sm:text-2xl font-bold text-white text-center">Your Mood Calendar</h1>

              <div className="flex flex-col xl:flex-row gap-6 items-start justify-center">

                {/* Calendar + legend */}
                <div className="flex flex-col gap-4 items-center w-full xl:w-auto">
                  <Calendar moodData={moodData} onSelectDate={setSelectedDate} filterMood={filterMood} />

                  {/* Mood filter legend */}
                  <div className="flex gap-1.5 sm:gap-2 flex-wrap justify-center">
                    {MOODS.map(m => {
                      const isActive = filterMood === m.label;
                      return (
                        <button key={m.label}
                          onClick={() => setFilterMood(isActive ? null : m.label)}
                          className={`flex items-center gap-1 sm:gap-1.5 text-xs px-2 sm:px-2.5 py-1 rounded-full border transition-all duration-200
                            ${isActive ? "text-white border-transparent shadow-md scale-105" : "text-gray-400 border-gray-700 hover:border-gray-500 hover:text-gray-200"}`}
                          style={isActive ? { background: m.hex, borderColor: m.hex } : {}}>
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.hex }} />
                          <span className="hidden sm:inline">{m.emoji} </span>{m.label}
                        </button>
                      );
                    })}
                    {filterMood && (
                      <button onClick={() => setFilterMood(null)}
                        className="text-xs px-2.5 py-1 rounded-full border border-gray-700 text-gray-500 hover:text-gray-300 transition">
                        ✕ Clear
                      </button>
                    )}
                  </div>

                  {/* Log Today — visible on mobile below calendar */}
                  <button onClick={() => setSelectedDate(todayKey)}
                    className="w-full max-w-sm py-3 rounded-2xl font-bold text-white text-sm sm:text-base transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 xl:hidden"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
                    ✦ Log Today's Mood
                  </button>
                </div>

                {/* Stats panel */}
                <div className="w-full xl:w-72 flex flex-col gap-3 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-purple-500/30" />
                    <span className="text-xs font-bold tracking-widest uppercase text-purple-300">Deep Insights</span>
                    <div className="flex-1 h-px bg-purple-500/30" />
                  </div>

                  {/* 3 stat cards */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { num: stats.total, label: "TOTAL", color: "text-white" },
                      { num: stats.topMood ? getMoodMeta(stats.topMood)?.emoji ?? "–" : "–", label: "COMMON", color: "text-yellow-400" },
                      { num: stats.happyCount, label: "HAPPY", color: "text-purple-300" },
                    ].map(s => (
                      <div key={s.label} className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-2 sm:p-3 text-center">
                        <div className={`text-lg sm:text-xl font-bold ${s.color}`}>{s.num}</div>
                        <div className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5 tracking-wider">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Sparkline */}
                  <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-3 sm:p-4">
                    <div className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                      Weekly Vibe <span className="text-gray-600 normal-case font-normal">(last 7 days)</span>
                    </div>
                    <Sparkline values={stats.last7} color="#a78bfa" />
                    <div className="flex justify-between text-[10px] text-gray-600 mt-1 px-0.5">
                      {["M","T","W","T","F","S","S"].map((d,i) => <span key={i}>{d}</span>)}
                    </div>
                  </div>

                  {/* Donut + breakdown */}
                  <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-3 sm:p-4">
                    <div className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Mood Breakdown</div>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <DonutChart slices={stats.slices} />
                      <div className="flex flex-col gap-1.5 sm:gap-2 flex-1 min-w-0">
                        {stats.slices.sort((a,b) => b.value - a.value).map(s => {
                          const meta = getMoodMeta(s.label);
                          return (
                            <div key={s.label} className="flex items-center gap-2 text-xs">
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                              <span className="text-gray-300 truncate flex-1">{meta?.emoji} {s.label}</span>
                              <span className="text-gray-500 font-medium">{s.value}x</span>
                            </div>
                          );
                        })}
                        {!stats.slices.length && <span className="text-gray-600 text-xs">No entries yet</span>}
                      </div>
                    </div>
                  </div>

                  {/* Freq bars */}
                  {stats.topMood && (
                    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-3 sm:p-4">
                      <div className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Mood Frequency</div>
                      <div className="flex flex-col gap-2">
                        {Object.entries(stats.counts).sort((a,b) => b[1]-a[1]).map(([mood, count]) => {
                          const max = Math.max(...Object.values(stats.counts));
                          const meta = getMoodMeta(mood);
                          return (
                            <div key={mood}>
                              <div className="flex justify-between text-[11px] text-gray-400 mb-0.5">
                                <span>{meta?.emoji} {mood}</span>
                                <span className="text-gray-500">{count}x</span>
                              </div>
                              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${Math.round((count/max)*100)}%`, background: meta?.hex }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Top tags */}
                  {stats.topTags.length > 0 && (
                    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-3 sm:p-4">
                      <div className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Top Tags</div>
                      <div className="flex flex-wrap gap-1.5">
                        {stats.topTags.map(([tag, count]) => (
                          <span key={tag} className="text-xs px-2.5 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300">
                            #{tag} <span className="text-purple-500">{count}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ════ ANALYTICS ════ */}
          {activeNav === "analytics" && (
            <div className="w-full">
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-5 sm:mb-6 text-center">Analytics</h1>
              <MoodStats moodData={moodData} />
            </div>
          )}

          {/* ════ SMART INSIGHTS ════ */}
          {activeNav === "vibe" && (
            <div className="flex flex-col gap-4 sm:gap-5 max-w-2xl mx-auto w-full">
              <div className="text-center">
                <h1 className="text-xl sm:text-2xl font-bold text-white">Smart Insights</h1>
                <p className="text-gray-500 text-sm mt-1">Personalized tips & quotes based on your mood history</p>
              </div>
              {(() => {
                const counts: Record<string, number> = {};
                for (const e of Object.values(moodData)) {
                  const entry = normalize(e);
                  for (const m of entry.moods) counts[m] = (counts[m] || 0) + 1;
                }
                const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]);
                const topMood = sorted[0]?.[0];
                const tip = topMood ? TIPS[topMood] : null;
                const quotes = topMood ? QUOTES[topMood] : null;
                const quote = quotes ? quotes[today.getDate() % quotes.length] : null;
                const topMoodMeta = getMoodMeta(topMood ?? "");
                const totalEntries = Object.values(counts).reduce((a,b) => a+b, 0);

                return tip ? (
                  <>
                    {/* Dominant mood */}
                    <div className="relative overflow-hidden rounded-2xl border border-purple-500/25 p-5 sm:p-6"
                      style={{ background: "linear-gradient(135deg,#1c1033 0%,#0f0c1e 100%)" }}>
                      <div className="absolute top-0 right-0 w-32 sm:w-40 h-32 sm:h-40 rounded-full opacity-10"
                        style={{ background: topMoodMeta?.hex, filter: "blur(40px)", transform: "translate(30%,-30%)" }} />
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="text-4xl sm:text-5xl">{topMoodMeta?.emoji}</div>
                        <div>
                          <p className="text-[10px] text-purple-400 uppercase tracking-widest mb-1">Your dominant mood</p>
                          <p className="text-lg sm:text-xl font-bold text-white">{topMood}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Logged <span className="text-purple-300 font-semibold">{counts[topMood!]}x</span> — {Math.round((counts[topMood!]/totalEntries)*100)}%
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-1 h-1.5">
                        {sorted.map(([mood, count]) => {
                          const meta = getMoodMeta(mood);
                          return <div key={mood} className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${Math.round((count/totalEntries)*100)}%`, background: meta?.hex ?? "#555" }} />;
                        })}
                      </div>
                      <div className="flex gap-2 sm:gap-3 mt-2 flex-wrap">
                        {sorted.map(([mood, count]) => {
                          const meta = getMoodMeta(mood);
                          return <span key={mood} className="text-[10px] text-gray-500 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: meta?.hex }} />
                            {meta?.emoji} {Math.round((count/totalEntries)*100)}%
                          </span>;
                        })}
                      </div>
                    </div>

                    {/* Quote */}
                    <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 border border-white/5"
                      style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e1035 50%,#0c1a2e 100%)" }}>
                      <div className="absolute inset-0 opacity-5"
                        style={{ backgroundImage: "radial-gradient(circle at 20% 50%,#a78bfa 0%,transparent 60%),radial-gradient(circle at 80% 20%,#38bdf8 0%,transparent 50%)" }} />
                      <p className="text-[10px] text-purple-400/80 uppercase tracking-widest mb-4 relative">✦ Quote of the day</p>
                      <blockquote className="relative">
                        <span className="text-4xl sm:text-5xl text-purple-500/20 font-serif leading-none absolute -top-2 -left-1">"</span>
                        <p className="text-gray-200 text-sm sm:text-base leading-relaxed pl-5 italic font-light">{quote}</p>
                      </blockquote>
                    </div>

                    {/* Tips */}
                    <div className="bg-[#111827] border border-gray-800/60 rounded-2xl p-4 sm:p-5">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-4">💡 Tips for {topMood} days</p>
                      <div className="flex flex-col gap-3">
                        {tip.tips.map((t, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold"
                              style={{ background: (topMoodMeta?.hex ?? "#7c3aed") + "22", color: topMoodMeta?.hex ?? "#a78bfa" }}>
                              {i+1}
                            </span>
                            <p className="text-gray-300 text-sm leading-relaxed">{t}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Full breakdown */}
                    <div className="bg-[#111827] border border-gray-800/60 rounded-2xl p-4 sm:p-5">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-4">📊 Full mood breakdown</p>
                      <div className="flex flex-col gap-3">
                        {sorted.map(([mood, count]) => {
                          const max = sorted[0][1];
                          const meta = getMoodMeta(mood);
                          return (
                            <div key={mood}>
                              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                                <span className="flex items-center gap-1.5">
                                  <span>{meta?.emoji}</span><span>{mood}</span>
                                  {mood === topMood && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/20">top</span>}
                                </span>
                                <span className="text-gray-500">{count}x · {Math.round((count/totalEntries)*100)}%</span>
                              </div>
                              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-700"
                                  style={{ width: `${Math.round((count/max)*100)}%`, background: meta?.hex }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 sm:py-20 gap-4 bg-[#1a1a1a] rounded-2xl border border-dashed border-gray-700">
                    <span className="text-4xl sm:text-5xl opacity-30">🧠</span>
                    <p className="text-gray-600 text-sm text-center px-4">No insights yet — start logging moods to unlock your patterns.</p>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ════ JOURNAL ════ */}
          {activeNav === "journal" && (
            <div className="max-w-2xl mx-auto w-full flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h1 className="text-xl sm:text-2xl font-bold text-white">Mood Journal</h1>
                <button onClick={() => setSelectedDate(todayKey)}
                  className="hidden sm:flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold py-2 px-4 rounded-full transition shadow-lg shadow-purple-500/20">
                  + Add Entry
                </button>
              </div>

              {/* Sparkline bar */}
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-3">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider whitespace-nowrap">7 days</span>
                <div className="flex-1"><Sparkline values={stats.last7} color="#a78bfa" /></div>
                <span className="text-[10px] text-gray-600 whitespace-nowrap">{Object.keys(moodData).length} entries</span>
              </div>

              {/* Search */}
              <input type="text" placeholder="🔍 Search mood, note, tag..."
                value={journalSearch} onChange={e => setJournalSearch(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500/50 transition" />

              {/* Tag filters */}
              {allTags.length > 0 && (
                <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                  <button onClick={() => setJournalTagFilter(null)}
                    className={`text-xs px-3 py-1 rounded-full border transition ${!journalTagFilter ? "bg-purple-600/20 border-purple-500/50 text-purple-300" : "border-gray-700 text-gray-500 hover:border-gray-500"}`}>
                    All
                  </button>
                  {allTags.map(tag => (
                    <button key={tag}
                      onClick={() => setJournalTagFilter(journalTagFilter === tag ? null : tag)}
                      className={`text-xs px-3 py-1 rounded-full border transition ${journalTagFilter === tag ? "bg-purple-600/20 border-purple-500/50 text-purple-300" : "border-gray-700 text-gray-500 hover:border-gray-500"}`}>
                      #{tag}
                    </button>
                  ))}
                </div>
              )}

              {/* Cards */}
              <div className="flex flex-col gap-2.5 sm:gap-3">
                {journalEntries.map(({ date, entry }) => {
                  const style = getMoodStyle(entry.moods);
                  const primaryHex = getMoodMeta(entry.moods[0])?.hex ?? "#6b7280";
                  return (
                    <div key={date}
                      className="rounded-xl p-3 sm:p-4 flex items-start gap-3 sm:gap-4 cursor-pointer transition-all duration-200 hover:brightness-110"
                      style={{ background: `linear-gradient(135deg,${primaryHex}12 0%,#1a1a1a 60%)`, border: `1px solid ${primaryHex}30` }}
                      onClick={() => setSelectedDate(date)}>
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex-shrink-0 flex items-center justify-center gap-0.5" style={style}>
                        {entry.moods.map((l: string) => <span key={l} className="text-sm drop-shadow">{getMoodMeta(l)?.emoji}</span>)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs sm:text-sm font-medium text-white">{date}</span>
                          {entry.moods.map((l: string) => (
                            <span key={l} className="text-xs px-2 py-0.5 rounded-full text-white/80 font-medium"
                              style={{ background: (getMoodMeta(l)?.hex ?? "#888") + "44" }}>{l}</span>
                          ))}
                        </div>
                        {entry.tags?.length ? (
                          <div className="flex gap-1 flex-wrap mb-1">
                            {entry.tags.map((t: string) => (
                              <span key={t} className="text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">#{t}</span>
                            ))}
                          </div>
                        ) : null}
                        {entry.note
                          ? <p className="text-gray-400 text-xs sm:text-sm line-clamp-2 italic">"{entry.note}"</p>
                          : <p className="text-gray-600 text-xs italic">No note written for this day</p>}
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedDate(date)}
                          className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-purple-600/30 text-gray-400 hover:text-purple-300 flex items-center justify-center text-xs transition">✏️</button>
                        <button onClick={() => { if (confirm(`Delete entry for ${date}?`)) handleDelete(date); }}
                          className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-red-600/30 text-gray-400 hover:text-red-400 flex items-center justify-center text-xs transition">🗑️</button>
                      </div>
                    </div>
                  );
                })}

                {journalEntries.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 sm:py-20 gap-3 bg-[#111] rounded-2xl border border-dashed border-gray-800">
                    <span className="text-4xl sm:text-5xl opacity-25">📓</span>
                    <p className="text-gray-500 text-sm font-medium text-center px-4">
                      {journalSearch || journalTagFilter ? "No entries match your search." : "Your journal is empty."}
                    </p>
                    {!journalSearch && !journalTagFilter && (
                      <button onClick={() => setSelectedDate(todayKey)}
                        className="mt-1 text-xs px-4 py-2 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 transition">
                        + Log today's mood
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* FAB mobile */}
              <button onClick={() => setSelectedDate(todayKey)}
                className="fixed bottom-20 right-4 w-12 h-12 sm:w-14 sm:h-14 bg-purple-600 hover:bg-purple-500 text-white text-xl sm:text-2xl rounded-full shadow-xl shadow-purple-500/30 flex items-center justify-center transition md:hidden z-40">
                +
              </button>
            </div>
          )}

        </main>
      </div>

      {showProfile && <ProfileModal user={user} onClose={() => setShowProfile(false)} />}
      {selectedDate && (
        <MoodDialog
          date={selectedDate}
          existingData={moodData[selectedDate] ? normalize(moodData[selectedDate]) : null}
          onClose={() => setSelectedDate(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
