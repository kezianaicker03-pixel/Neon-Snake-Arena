import React from 'react';
import { LeaderboardItem } from '../types';

interface LeaderboardProps {
  items: LeaderboardItem[];
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ items }) => {
  return (
    <aside
      id="leaderboard-panel"
      className="w-64 lg:w-72 flex flex-col gap-3 lg:gap-4 shrink-0 select-none min-h-0"
    >
      {/* Top Card: Live Leaderboard */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 lg:p-5 backdrop-blur-sm shadow-xl">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-fuchsia-500 rounded-full shadow-[0_0_8px_#f5d0fe]" />
            <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-white/70">
              Leaderboard
            </h2>
          </div>
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
            LENGTH
          </span>
        </div>

        {/* Snake entries ranked by length */}
        <div className="flex flex-col gap-2">
          {items.slice(0, 5).map((item, index) => {
            const isPlayer = item.isPlayer;
            const rankStr = (index + 1).toString().padStart(2, '0');

            if (isPlayer) {
              return (
                <div
                  key={item.id}
                  className="flex justify-between items-center bg-cyan-500/20 border border-cyan-500/30 p-2 sm:p-2.5 rounded-lg shadow-[0_0_12px_rgba(34,211,238,0.15)]"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <span className="text-[10px] font-black text-cyan-400">
                      {rankStr}
                    </span>
                    <div
                      className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_6px_#00f7ff]"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs sm:text-sm font-bold text-white truncate">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400 shrink-0">
                    {item.length}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={item.id}
                className="flex justify-between items-center bg-white/5 border border-transparent p-2 sm:p-2.5 rounded-lg"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <span className="text-[10px] font-black text-white/40">
                    {rankStr}
                  </span>
                  <div
                    className="w-2 h-2 rounded-full shrink-0 opacity-80"
                    style={{ backgroundColor: item.color }}
                  />
                  <span
                    className="text-xs sm:text-sm font-medium truncate opacity-80"
                    style={{ color: item.color }}
                  >
                    {item.name}
                  </span>
                </div>
                <span className="text-xs font-mono text-white/60 shrink-0">
                  {item.length}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Card: Arena Status & Rare Spawn */}
      <div className="grow bg-gradient-to-br from-fuchsia-900/20 to-transparent border border-white/5 rounded-2xl p-4 lg:p-5 flex flex-col justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-fuchsia-400 mb-1.5">
            Arena Status
          </div>
          <p className="text-xs text-white/50 leading-relaxed italic font-sans">
            Collect glowing orbs to extend your length. Avoid the perimeter wall and opponent head-on collisions.
          </p>
        </div>

        <div className="flex items-center gap-3.5 bg-black/40 p-3 rounded-xl border border-white/10 shadow-inner">
          <div className="w-10 h-10 rounded-full border-2 border-orange-500/50 flex items-center justify-center animate-pulse shrink-0">
            <div className="w-4 h-4 bg-orange-500 rounded-full shadow-[0_0_10px_#f97316]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">
              Rare Spawn
            </span>
            <span className="text-xs font-bold text-white">
              Mega Energy (+50)
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

