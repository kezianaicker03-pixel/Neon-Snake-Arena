import React, { useState, useEffect, useRef } from 'react';
import { Play, User, Sparkles } from 'lucide-react';

interface StartScreenProps {
  initialName?: string;
  onStartGame: (name: string) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  initialName = '',
  onStartGame,
}) => {
  const [name, setName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setName(initialName);
    // Focus input on mount
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [initialName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length > 0) {
      onStartGame(trimmed);
    }
  };

  const isNameEntered = name.trim().length > 0;

  return (
    <div
      id="start-screen"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none"
    >
      <div className="w-full max-w-md bg-[#090a14] border-2 border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_0_70px_rgba(0,0,0,0.95)] text-center relative overflow-hidden">
        {/* Accent top gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-orange-400" />

        {/* Ambient top badge */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,0.25)] mb-4 text-cyan-400">
          <User className="w-7 h-7" />
        </div>

        {/* Subtitle / Brand */}
        <div className="text-[10px] uppercase tracking-[0.35em] font-bold text-cyan-400 mb-1">
          Neon Snake Arena
        </div>

        {/* Header */}
        <h2 className="text-2xl sm:text-3xl font-black italic tracking-tighter uppercase text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] mb-6">
          ENTER YOUR NAME
        </h2>

        {/* Name Input Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="relative">
            <input
              ref={inputRef}
              id="player-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Type your name..."
              maxLength={18}
              autoComplete="off"
              spellCheck="false"
              className="w-full py-3.5 px-4 bg-white/5 border-2 border-white/15 focus:border-cyan-400 rounded-2xl text-center text-lg sm:text-xl font-bold tracking-wide text-white placeholder:text-white/30 outline-none transition-all duration-200 shadow-inner focus:shadow-[0_0_20px_rgba(34,211,238,0.25)]"
            />
            {name.length > 0 && (
              <span className="absolute right-3.5 bottom-3.5 text-[10px] font-mono text-white/30">
                {name.length}/18
              </span>
            )}
          </div>

          {/* Large START GAME Button */}
          <button
            id="btn-start-game"
            type="submit"
            disabled={!isNameEntered}
            className={`w-full py-4 px-6 rounded-2xl font-black italic tracking-widest text-base sm:text-lg uppercase transition-all duration-200 flex items-center justify-center gap-2 shadow-lg ${
              isNameEntered
                ? 'bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-orange-400 hover:brightness-110 active:scale-98 text-black shadow-[0_0_30px_rgba(34,211,238,0.5)] cursor-pointer'
                : 'bg-white/10 text-white/30 border border-white/5 cursor-not-allowed'
            }`}
          >
            <Play className="w-5 h-5 fill-current" />
            START GAME
          </button>
        </form>

        {/* Controls Info Banner */}
        <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-center gap-2 text-white/40 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>Use Arrow Keys to control your snake</span>
        </div>
      </div>
    </div>
  );
};
