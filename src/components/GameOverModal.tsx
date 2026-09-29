import React, { useEffect } from 'react';
import { RotateCcw, Trophy, Award, Clock, Apple, Skull, User } from 'lucide-react';
import { GameStats } from '../types';

interface GameOverModalProps {
  stats: GameStats;
  playerName: string;
  highScore: number;
  onPlayAgain: () => void;
  onChangePlayer: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  playerName,
  highScore,
  onPlayAgain,
  onChangePlayer,
}) => {
  // Listen for Enter or Space to quickly restart
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onPlayAgain();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPlayAgain]);

  const isNewRecord = stats.score > 0 && stats.score >= highScore;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  const displayName = playerName || stats.playerName || 'Player';

  return (
    <div
      id="game-over-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none"
    >
      <div className="w-full max-w-md bg-[#0a0a12] border-2 border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(0,0,0,0.9)] text-center relative overflow-hidden">
        {/* Accent top gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-orange-400" />

        {/* Skull icon */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/5 border border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.3)] mb-3 text-red-400">
          <Skull className="w-7 h-7 animate-bounce" />
        </div>

        {/* Header */}
        <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-red-400 mb-1">
          Session Terminated
        </div>
        <h2 className="text-3xl sm:text-4xl font-black italic tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-fuchsia-400 to-orange-400 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)] mb-2">
          GAME OVER
        </h2>

        {/* Player Name Display */}
        <div className="mb-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
          <User className="w-4 h-4 text-cyan-400" />
          <span className="text-xs uppercase tracking-widest text-white/60 font-bold">Player:</span>
          <span className="text-sm sm:text-base font-black tracking-wider text-white font-mono">{displayName}</span>
        </div>

        {/* Cause of death */}
        <p className="text-xs sm:text-sm text-white/50 italic font-sans mb-5">
          {stats.deathReason || 'Eliminated in the arena'}
        </p>

        {/* New High Score banner if applicable */}
        {isNewRecord && (
          <div className="mb-5 py-1.5 px-4 rounded-full bg-orange-500/10 border border-orange-400/40 inline-flex items-center gap-2 text-orange-300">
            <Trophy className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-bold tracking-wider uppercase font-sans">
              NEW PERSONAL RECORD!
            </span>
          </div>
        )}

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Final Score */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-cyan-400 text-xs mb-1">
              <Award className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-white/50">Final Score</span>
            </div>
            <span className="text-2xl font-black italic tracking-tighter text-white">
              {stats.score}
            </span>
          </div>

          {/* Snake Length */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-fuchsia-400 text-xs mb-1">
              <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-white/50">Length</span>
            </div>
            <span className="text-2xl font-black italic tracking-tighter text-white">
              {stats.length}
            </span>
          </div>

          {/* Food Collected */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-orange-400 text-xs mb-1">
              <Apple className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-white/50">Food Orbs</span>
            </div>
            <span className="text-xl font-black italic tracking-tighter text-white">
              {stats.foodCollected}
            </span>
          </div>

          {/* Survival Time */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-cyan-300 text-xs mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-white/50">Survival Time</span>
            </div>
            <span className="text-xl font-black italic tracking-tighter text-white">
              {formatTime(stats.survivalTimeSeconds)}
            </span>
          </div>
        </div>

        {/* Large PLAY AGAIN Button */}
        <button
          id="btn-play-again"
          type="button"
          onClick={onPlayAgain}
          autoFocus
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-orange-400 hover:brightness-110 active:scale-98 text-base sm:text-lg font-black italic tracking-widest text-black shadow-[0_0_25px_rgba(34,211,238,0.5)] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer uppercase"
        >
          <RotateCcw className="w-5 h-5 stroke-[2.5]" />
          PLAY AGAIN
        </button>

        {/* Change Player Button */}
        <div className="mt-3 flex items-center justify-center">
          <button
            id="btn-change-player"
            type="button"
            onClick={onChangePlayer}
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:underline tracking-wider uppercase inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors py-1.5 px-3 rounded-lg hover:bg-white/5"
          >
            <User className="w-3.5 h-3.5" />
            Change Player
          </button>
        </div>

        <p className="mt-2 text-[11px] text-white/40 font-mono">
          Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70">Space</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70">Enter</kbd> to restart
        </p>
      </div>
    </div>
  );
};
