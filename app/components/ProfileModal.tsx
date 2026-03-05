"use client";
import { useState } from "react";
import { updateProfile } from "firebase/auth";
import { auth } from "../pages/firebase";

export default function ProfileModal({ user, onClose }: { user: any; onClose: () => void }) {
  const [name, setName]           = useState(user.displayName || "");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading]     = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile(auth.currentUser!, { displayName: name });

      const stored = localStorage.getItem("authUser");
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem("authUser", JSON.stringify({ ...parsed, displayName: name }));
      }

      setIsEditing(false);
      alert("Profile updated!");
      window.location.reload();
      onClose();
    } catch (error: any) {
      alert("Error: " + error.message);
    }
    setLoading(false);
  };

  const initials = (name || "?").charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-[2rem] shadow-2xl p-8 w-full max-w-sm">

        {/* ── Avatar (display only) ── */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-4xl font-bold text-white shadow-lg overflow-hidden mb-4">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>

          {!isEditing ? (
            <>
              <h2 className="text-white text-xl font-bold">{name}</h2>
              <p className="text-gray-500 text-sm">{user.email}</p>
            </>
          ) : (
            <p className="text-purple-400 text-xs font-bold uppercase tracking-widest">Editing Mode</p>
          )}
        </div>

        {/* ── Form ── */}
        <div className="bg-[#0a0a0a] rounded-2xl p-5 mb-8 space-y-4 border border-gray-800">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Display Name</label>
            {isEditing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-purple-500/50 rounded-lg px-3 py-2 text-white outline-none focus:ring-1 focus:ring-purple-500 transition-all"
              />
            ) : (
              <div className="text-white text-sm px-1">{name}</div>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Email (Read Only)</label>
            <div className="text-gray-500 text-sm px-1 italic">{user.email}</div>
          </div>
        </div>

        {/* ── Buttons ── */}
        <div className="flex flex-col gap-3">
          {isEditing ? (
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all shadow-lg shadow-purple-900/20 active:scale-95 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full py-3 rounded-xl bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white font-bold transition-all border border-gray-700"
            >
              Edit Profile
            </button>
          )}
          <button
            onClick={isEditing ? () => { setIsEditing(false); setName(user.displayName || ""); } : onClose}
            className="w-full py-2 text-gray-500 hover:text-gray-300 text-sm font-medium transition-colors"
          >
            {isEditing ? "Cancel" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}