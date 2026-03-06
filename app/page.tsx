"use client";

import AuthDialog from "./pages/AuthDialog";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadAuthState } from "./pages/Auth";
import Image from "next/image";

const MOODS = [
  { cls: "bg-yellow-400", shadow: "shadow-yellow-400/50", label: "Happy"   },
  { cls: "bg-blue-400",   shadow: "shadow-blue-400/50",   label: "Sad"     },
  { cls: "bg-red-500",    shadow: "shadow-red-500/50",    label: "Angry"   },
  { cls: "bg-gray-400",   shadow: "shadow-gray-400/50",   label: "Tired"   },
  { cls: "bg-orange-400", shadow: "shadow-orange-400/50", label: "Anxious" },
  { cls: "bg-cyan-400",   shadow: "shadow-cyan-400/50",   label: "Calm"    },
];

const WEIGHTS = [20, 14, 8, 12, 10, 16];

function weightedRandom() {
  const total = WEIGHTS.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < MOODS.length; i++) { r -= WEIGHTS[i]; if (r <= 0) return i; }
  return 0;
}

function generateGrid(size: number) {
  return Array.from({ length: size }, () => weightedRandom());
}

const FEATURES = [
  {
    icon: "🎨",
    iconBg: "bg-purple-500/10 border border-purple-500/20",
    title: "The Mood Matrix",
    desc: "Log your daily mood with a single tap. Watch your emotional landscape take shape as a colorful mosaic over weeks and months.",
  },
  {
    icon: "🧠",
    iconBg: "bg-green-500/10 border border-green-500/20",
    title: "Smart Insights",
    desc: "Analyzes your recorded emotional patterns to surface trends and triggers — giving you personalized guidance to improve your wellbeing.",
  },
  {
    icon: "📓",
    iconBg: "bg-cyan-500/10 border border-cyan-500/20",
    title: "Daily Journal",
    desc: "Capture thoughts, set intentions, and reflect on your day. Your private space to grow with mood context for deeper self-awareness.",
  },
];

export default function Home() {
  const [user, setUser] = useState(null);
  const [showSignUp, setShowSignUp] = useState(false);
  const [grid, setGrid] = useState<number[]>([]);
  const [tooltip, setTooltip] = useState<{ idx: number; label: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const u = loadAuthState();
    if (u) { setUser(u); router.push("/dashboard"); }
  }, []);

  useEffect(() => { setGrid(generateGrid(35)); }, []);

  const handleCellClick = (idx: number) => {
    setGrid(prev => { const next = [...prev]; next[idx] = weightedRandom(); return next; });
  };

  return (
    <div className="bg-[#0a0a0a] flex flex-col min-h-screen">

      {/* ── Header ── */}
      <header className="bg-[#1a1a1a] border-b border-gray-800 shadow-lg sticky top-0 z-50">
        <nav className="container mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Image src="/logo.png" alt="Logo" width={40} height={40} className="filter brightness-110 flex-shrink-0" />
          <div className="text-lg sm:text-2xl font-bold text-purple-400 truncate">Mood Tracking Journal</div>
          <div className="ml-auto flex-shrink-0">
            <AuthDialog
              onLogin={setUser}
              customClass="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-3 sm:px-4 rounded-full transition duration-300 text-sm"
              externalOpen={showSignUp}
              onExternalClose={() => setShowSignUp(false)}
            />
          </div>
        </nav>
      </header>

      <main className="flex-grow">

        {/* ── HERO ── */}
        <section className="py-12 sm:py-20 px-4 sm:px-6">
          <div className="container mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-12 max-w-5xl">

            {/* Text */}
            <div className="flex-1 text-center md:text-left w-full">
              <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Mood Analytics
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
                Track Your Vibe.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                  Master Your Journey.
                </span>
              </h1>

              <p className="text-gray-400 text-base sm:text-lg mb-8 max-w-md mx-auto md:mx-0">
                Build your personal Mood Mosaic — log daily emotions, discover balance through smart statistics, and let data-driven insights guide your wellbeing.
              </p>

              <div className="flex gap-3 justify-center md:justify-start flex-wrap">
                <button
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 sm:px-8 rounded-full transition duration-300 shadow-lg shadow-purple-500/30 text-sm sm:text-base"
                  onClick={() => setShowSignUp(true)}
                >
                  ✦ Get Started
                </button>
                <a
                  href="#features"
                  className="border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-gray-200 font-medium py-3 px-6 sm:px-8 rounded-full transition duration-300 text-sm sm:text-base"
                >
                  How it works →
                </a>
              </div>
            </div>

            {/* Mosaic */}
            <div className="flex-1 flex flex-col items-center gap-4 w-full max-w-sm mx-auto md:max-w-none">
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                Your Mood Mosaic — July 2026
              </span>

              <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-4 sm:p-5 shadow-xl isolate w-full">
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                  {grid.map((moodIdx, i) => {
                    const mood = MOODS[moodIdx];
                    return (
                      <div
                        key={i}
                        title={mood.label}
                        onClick={() => handleCellClick(i)}
                        onMouseEnter={() => setTooltip({ idx: i, label: mood.label })}
                        onMouseLeave={() => setTooltip(null)}
                        className={`
                          relative w-full aspect-square rounded-md sm:rounded-lg cursor-pointer
                          ${mood.cls} shadow-md ${mood.shadow}
                          hover:scale-125 hover:brightness-125
                          transition-all duration-150
                        `}
                      >
                        {tooltip?.idx === i && (
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded-md whitespace-nowrap z-10 pointer-events-none">
                            {mood.label}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
                {MOODS.map((m) => (
                  <div key={m.label} className="flex items-center gap-1.5 text-xs text-gray-400">
                    <div className={`w-2.5 h-2.5 rounded-sm ${m.cls}`} />
                    {m.label}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full">
                {[
                  { num: "18",  label: "Great Days", color: "text-green-400"  },
                  { num: "31",  label: "Day Streak",  color: "text-purple-400" },
                  { num: "87%", label: "Positivity",  color: "text-cyan-400"  },
                ].map((s) => (
                  <div key={s.label} className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-2 sm:p-3 text-center">
                    <div className={`text-lg sm:text-xl font-bold ${s.color}`}>{s.num}</div>
                    <div className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="features" className="py-12 sm:py-16 px-4 sm:px-6 border-t border-gray-800/60">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-10 sm:mb-12">
              <div className="inline-block bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
                Features
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Keep Track of Every Milestone</h2>
              <p className="text-gray-400 text-sm sm:text-base max-w-md mx-auto">Central intelligence for your daily goals — powered by smart statistics and beautiful visualizations.</p>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="bg-[#1a1a1a] border border-gray-800 hover:border-purple-500/40 rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 group"
                >
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl mb-3 sm:mb-4 ${f.iconBg}`}>
                    {f.icon}
                  </div>
                  <h3 className="text-white font-bold text-base sm:text-lg mb-2 group-hover:text-purple-300 transition-colors duration-200">
                    {f.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      <footer className="bg-[#1a1a1a] border-t border-gray-800 py-5 text-center">
        <div className="container mx-auto px-4 sm:px-6">
          <p className="text-gray-500 text-xs sm:text-sm">© 2026 Sirirat Puntamunee. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
