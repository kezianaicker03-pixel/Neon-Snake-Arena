import React from 'react';
import { Volume2, VolumeX, Pause, Play, Trophy, Clock, User } from 'lucide-react';

interface HUDProps {
  playerName: string;
  score: number;
  length: number;
  highScore: number;
  survivalTime: number; // in seconds
  isPaused: boolean;
  isMuted: boolean;
  activeSnakesCount?: number;
  totalSnakesCount?: number;
  onTogglePause: () => void;
  onToggleMute: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  playerName,
  score,
  length,
  highScore,
  survivalTime,
  isPaused,
  isMuted,
  activeSnakesCount = 5,
  totalSnakesCount = 5,
  onTogglePause,
  onToggleMute,
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formattedScore = score.toString().padStart(6, '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return (
    <header
      id="game-hud"
      className="flex flex-wrap justify-between items-end gap-3 mb-3 sm:mb-4 px-1 sm:px-2 shrink-0 select-none"
    >
      {/* Left: Player Name Badge, Score & Length Metric Blocks */}
      <div className="flex items-end gap-4 sm:gap-6">
        {/* Player Name Pill */}
        <div className="flex flex-col justify-end pb-0.5">
          <div className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-400/30 rounded-xl px-2.5 sm:px-3 py-1 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.1)]">
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs sm:text-sm font-bold tracking-wider font-mono truncate max-w-[100px] sm:max-w-[160px]">
              {playerName || 'Player'}
            </span>
          </div>
        </div>

        {/* Session Score */}
        <div className="flex flex-col">
          <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-cyan-400 font-bold">
            Score
          </span>
          <span className="text-2xl sm:text-4xl font-black italic tracking-tighter text-white drop-shadow-[0_0_12px_rgba(34,211,238,0.5)]">
            {formattedScore}
          </span>
        </div>

        {/* Snake Length */}
        <div className="flex flex-col">
          <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-fuchsia-400 font-bold">
            Length
          </span>
          <span className="text-2xl sm:text-4xl font-black italic tracking-tighter text-white drop-shadow-[0_0_12px_rgba(217,70,239,0.5)]">
            {length}{' '}
            <span className="text-xs sm:text-sm uppercase not-italic opacity-50 font-semibold tracking-normal">
              Units
            </span>
          </span>
        </div>
      </div>

      {/* Center: Glowing Italic Title with Gradient Accent Line */}
      <div className="hidden md:flex flex-col items-center">
        <h1 className="text-lg lg:text-2xl font-black tracking-[0.35em] uppercase italic bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-orange-400">
          Neon Snake Arena
        </h1>
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/40 to-transparent mt-1" />
      </div>

      {/* Right: Active Snakes, Time & Controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Active Snakes counter */}
        <div className="text-right hidden sm:block">
          <div className="text-[10px] uppercase tracking-[0.2em] text-orange-400 font-bold">
            Active Snakes
          </div>
          <div className="text-xl sm:text-2xl font-black italic tracking-tighter text-white">
            {activeSnakesCount.toString().padStart(2, '0')} / {totalSnakesCount.toString().padStart(2, '0')}
          </div>
        </div>

        {/* Survival Time display */}
        <div className="hidden lg:flex flex-col items-end">
          <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/80 font-bold flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" /> Time
          </div>
          <div className="text-lg font-mono font-bold text-white/90">
            {formatTime(survivalTime)}
          </div>
        </div>

        {/* High Score Badge */}
        {highScore > 0 && (
          <div className="hidden xl:flex items-center gap-1.5 bg-amber-500/10 border border-amber-400/30 rounded-lg px-2.5 py-1 text-amber-300">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-mono font-bold">
              BEST: {highScore}
            </span>
          </div>
        )}

        {/* Audio & Pause Toggle Controls */}
        <div className="flex items-center gap-1.5">
          <button
            id="btn-sound-toggle"
            type="button"
            onClick={onToggleMute}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="bg-white/5 hover:bg-white/10 active:scale-95 transition-all duration-150 border border-white/10 hover:border-cyan-400/50 rounded-xl p-2 text-white/70 hover:text-cyan-300 cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            id="btn-pause-toggle"
            type="button"
            onClick={onTogglePause}
            title={isPaused ? 'Resume Game' : 'Pause Game'}
            className="bg-white/5 hover:bg-white/10 active:scale-95 transition-all duration-150 border border-white/10 hover:border-fuchsia-400/50 rounded-xl p-2 text-white/70 hover:text-fuchsia-300 cursor-pointer"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};

