import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GameOverModal } from './components/GameOverModal';
import { HUD } from './components/HUD';
import { Leaderboard } from './components/Leaderboard';
import { NeonCanvas, NeonCanvasHandle } from './components/NeonCanvas';
import { StartScreen } from './components/StartScreen';
import { FloatingText, Food, GameStats, LeaderboardItem, Particle, Snake } from './types';
import {
  isSoundMuted,
  playCrashSound,
  playEatSound,
  playEliminateSound,
  playStartSound,
  setSoundMuted,
} from './utils/audio';
import {
  ARENA_HEIGHT,
  ARENA_WIDTH,
  BODY_RADIUS,
  HEAD_RADIUS,
  TOTAL_FOOD_COUNT,
} from './utils/constants';
import {
  checkFoodCollisions,
  convertSnakeToFood,
  createExplosion,
  createFloatingText,
  createFood,
  getLeaderboard,
  initFoodList,
  initSnakes,
  moveSnake,
  respawnAISnake,
  updateAISteering,
} from './utils/gameEngine';

export default function App() {
  // Game states
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [playerName, setPlayerName] = useState(() => {
    try {
      return localStorage.getItem('neon_snake_player_name') || '';
    } catch {
      return '';
    }
  });
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(isSoundMuted());
  const [score, setScore] = useState(0);
  const [length, setLength] = useState(16);
  const [highScore, setHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('neon_snake_high_score') || '0', 10) || 0;
    } catch {
      return 0;
    }
  });
  const [survivalTime, setSurvivalTime] = useState(0);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);

  // Core simulation references (kept in refs for high-performance 60fps loop)
  const snakesRef = useRef<Snake[]>([]);
  const foodsRef = useRef<Food[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const respawnQueueRef = useRef<{ snake: Snake; timer: number }[]>([]);

  // Simulation flags
  const isRunningRef = useRef(false);
  const lastTimeRef = useRef<number>(performance.now());
  const survivalTimerRef = useRef<number | null>(null);
  const canvasRef = useRef<NeonCanvasHandle | null>(null);
  const tickCountRef = useRef<number>(0);

  // Keyboard input intent: target heading angle for player
  const playerTargetAngleRef = useRef<number>(0);
  const currentAngleRef = useRef<number>(0);

  // Initialize or reset game
  const initGame = useCallback((nameOverride?: string) => {
    const activeName = nameOverride || playerName || 'Player';
    const freshSnakes = initSnakes(activeName);
    const freshFoods = initFoodList();

    snakesRef.current = freshSnakes;
    foodsRef.current = freshFoods;
    particlesRef.current = [];
    floatingTextsRef.current = [];
    respawnQueueRef.current = [];

    const player = freshSnakes[0];
    playerTargetAngleRef.current = player.angle;
    currentAngleRef.current = player.angle;

    setScore(0);
    setLength(player.segments.length);
    setSurvivalTime(0);
    setIsGameOver(false);
    setIsPaused(false);
    setStats(null);
    isRunningRef.current = true;

    setLeaderboard(getLeaderboard(freshSnakes));
    playStartSound();
  }, [playerName]);

  // Initial load: prepare background entities without starting simulation
  useEffect(() => {
    const freshSnakes = initSnakes(playerName || 'Player');
    const freshFoods = initFoodList();
    snakesRef.current = freshSnakes;
    foodsRef.current = freshFoods;
    setLeaderboard(getLeaderboard(freshSnakes));
    isRunningRef.current = false;
  }, []);

  // Handle start game from StartScreen
  const handleStartGame = useCallback((chosenName: string) => {
    setPlayerName(chosenName);
    try {
      localStorage.setItem('neon_snake_player_name', chosenName);
    } catch {
      // ignore
    }
    setIsGameStarted(true);
    initGame(chosenName);
  }, [initGame]);

  // Handle change player from GameOverModal
  const handleChangePlayer = useCallback(() => {
    setIsGameOver(false);
    setIsGameStarted(false);
    isRunningRef.current = false;
  }, []);

  // Handle survival timer increment
  useEffect(() => {
    if (!isGameStarted || isGameOver || isPaused) return;

    survivalTimerRef.current = window.setInterval(() => {
      setSurvivalTime((prev) => prev + 1);
    }, 1000);

    return () => {
      if (survivalTimerRef.current) clearInterval(survivalTimerRef.current);
    };
  }, [isGameStarted, isGameOver, isPaused]);

  // Arrow Key Controls (ONLY keyboard arrow keys, immediate and smooth response)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isGameStarted) return;

      // Pause shortcut
      if (e.code === 'KeyP' || (e.code === 'Space' && !isGameOver)) {
        e.preventDefault();
        setIsPaused((p) => !p);
        return;
      }

      // Check arrow keys
      let newTargetAngle: number | null = null;
      if (e.code === 'ArrowUp') {
        newTargetAngle = -Math.PI / 2; // Up
      } else if (e.code === 'ArrowDown') {
        newTargetAngle = Math.PI / 2; // Down
      } else if (e.code === 'ArrowLeft') {
        newTargetAngle = Math.PI; // Left
      } else if (e.code === 'ArrowRight') {
        newTargetAngle = 0; // Right
      }

      if (newTargetAngle !== null) {
        // Prevent default window scrolling
        e.preventDefault();

        // Check 180° reverse lock to prevent instant suicide into own neck if longer than 3 segments
        const player = snakesRef.current.find((s) => s.isPlayer && s.isAlive);
        if (player && player.segments.length > 3) {
          const angleDifference = Math.abs(
            Math.atan2(
              Math.sin(newTargetAngle - player.angle),
              Math.cos(newTargetAngle - player.angle)
            )
          );
          // If trying to reverse directly 180 degrees backwards, ignore
          if (angleDifference > Math.PI * 0.85) {
            return;
          }
        }

        playerTargetAngleRef.current = newTargetAngle;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameStarted, isGameOver]);

  // Sound toggle handler
  const handleToggleMute = useCallback(() => {
    const nextMuted = !isSoundMuted();
    setSoundMuted(nextMuted);
    setIsMuted(nextMuted);
  }, []);

  // Pause toggle handler
  const handleTogglePause = useCallback(() => {
    if (!isGameOver && isGameStarted) {
      setIsPaused((p) => !p);
    }
  }, [isGameOver, isGameStarted]);

  // Trigger game over
  const triggerGameOver = useCallback(
    (reason: string) => {
      if (isGameOver) return;
      playCrashSound();

      const player = snakesRef.current.find((s) => s.isPlayer);
      const finalScore = player ? player.score : 0;
      const finalLength = player ? player.segments.length : 0;
      const foodCollected = player ? player.foodEaten : 0;

      // Particles at player head crash
      if (player && player.segments.length > 0) {
        const head = player.segments[0];
        particlesRef.current.push(...createExplosion(head.x, head.y, '#ff0055', 40));
      }

      // Update High Score if beaten
      if (finalScore > highScore) {
        setHighScore(finalScore);
        try {
          localStorage.setItem('neon_snake_high_score', finalScore.toString());
        } catch {
          // ignore localStorage error
        }
      }

      setStats({
        playerName: playerName || 'Player',
        score: finalScore,
        length: finalLength,
        foodCollected,
        survivalTimeSeconds: survivalTime,
        deathReason: reason,
      });

      setIsGameOver(true);
      isRunningRef.current = false;
    },
    [isGameOver, highScore, survivalTime, playerName]
  );

  // Main game physics update loop
  useEffect(() => {
    let animationFrameId: number;

    const gameTick = (now: number) => {
      const delta = Math.min((now - lastTimeRef.current) / 1000, 0.05); // cap delta
      lastTimeRef.current = now;

      if (isGameStarted && !isGameOver && !isPaused && isRunningRef.current) {
        const snakes = snakesRef.current;
        const player = snakes.find((s) => s.isPlayer && s.isAlive);

        // 1. Process Player steering
        if (player) {
          // Fast responsive turn towards arrow key target angle
          const target = playerTargetAngleRef.current;
          let diff = target - player.angle;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;

          // Quick smooth turn response
          const maxTurn = 0.28;
          player.angle += Math.sign(diff) * Math.min(Math.abs(diff), maxTurn);
          currentAngleRef.current = player.angle;
        }

        // 2. Update AI steering
        for (const snake of snakes) {
          if (!snake.isPlayer && snake.isAlive) {
            updateAISteering(snake, foodsRef.current, snakes);
          }
        }

        // 3. Move all snakes
        for (const snake of snakes) {
          if (snake.isAlive) {
            moveSnake(snake);
          }
        }

        // 4. Check Food collisions
        const replacements: Food[] = [];
        for (const snake of snakes) {
          if (!snake.isAlive) continue;
          foodsRef.current = checkFoodCollisions(snake, foodsRef.current, (eatenFood) => {
            if (snake.isPlayer) {
              playEatSound(eatenFood.isSpecial);
              setScore(snake.score);
              setLength(snake.segments.length);

              // Floating score popup
              floatingTextsRef.current.push(
                createFloatingText(
                  eatenFood.x,
                  eatenFood.y - 12,
                  `+${eatenFood.points}`,
                  eatenFood.isSpecial ? '#ffe600' : '#00f7ff'
                )
              );

              // Sparkle particles
              particlesRef.current.push(
                ...createExplosion(
                  eatenFood.x,
                  eatenFood.y,
                  eatenFood.isSpecial ? '#ffffaa' : eatenFood.color,
                  eatenFood.isSpecial ? 18 : 8
                )
              );
            }

            // Queue replacement food
            replacements.push(createFood());
          });
        }
        if (replacements.length > 0) {
          foodsRef.current.push(...replacements);
        }
        while (foodsRef.current.length < TOTAL_FOOD_COUNT) {
          foodsRef.current.push(createFood());
        }

        // 5. Collisions: Player Wall Collision
        if (player) {
          const head = player.segments[0];
          const wallMargin = 12;
          if (
            head.x <= wallMargin ||
            head.x >= ARENA_WIDTH - wallMargin ||
            head.y <= wallMargin ||
            head.y >= ARENA_HEIGHT - wallMargin
          ) {
            triggerGameOver('Crashed into the outer arena wall!');
          }
        }

        // 6. Collisions: Snake vs Snake
        for (let i = 0; i < snakes.length; i++) {
          const snakeA = snakes[i];
          if (!snakeA.isAlive || snakeA.segments.length === 0) continue;
          const headA = snakeA.segments[0];

          for (let j = 0; j < snakes.length; j++) {
            const snakeB = snakes[j];
            if (!snakeB.isAlive || snakeB.segments.length === 0) continue;

            // Self-collision is completely disabled: snakes never die from their own body
            if (snakeA.id === snakeB.id) continue;

            // Check head of snakeA touching body of another snake (snakeB)
            for (let s = 1; s < snakeB.segments.length; s++) {
              const segB = snakeB.segments[s];
              const dist = Math.hypot(headA.x - segB.x, headA.y - segB.y);

              if (dist < HEAD_RADIUS + BODY_RADIUS - 4) {
                // COLLISION OCCURRED!
                if (snakeA.isPlayer) {
                  // Player's HEAD touched another snake's body: GAME OVER!
                  triggerGameOver(`Collided with ${snakeB.name}'s body!`);
                  break;
                } else if (snakeB.isPlayer) {
                  // Another snake's head touched player's body: that snake is ELIMINATED!
                  snakeA.isAlive = false;
                  playEliminateSound();

                  // Turn eliminated snake into glowing food pieces
                  const droppedFood = convertSnakeToFood(snakeA);
                  foodsRef.current.push(...droppedFood);

                  // Particles & celebration text
                  particlesRef.current.push(
                    ...createExplosion(headA.x, headA.y, snakeA.color.head, 35)
                  );
                  floatingTextsRef.current.push(
                    createFloatingText(
                      headA.x,
                      headA.y - 20,
                      `ELIMINATED ${snakeA.name}!`,
                      snakeA.color.head
                    )
                  );

                  // Player score bonus for eliminating an enemy snake
                  player.score += 150;
                  setScore(player.score);

                  // Queue respawn after 4 seconds
                  respawnQueueRef.current.push({ snake: snakeA, timer: 240 });
                  break;
                } else {
                  // AI snake head hit another AI snake body: that AI snake eliminated
                  snakeA.isAlive = false;
                  const droppedFood = convertSnakeToFood(snakeA);
                  foodsRef.current.push(...droppedFood);
                  particlesRef.current.push(
                    ...createExplosion(headA.x, headA.y, snakeA.color.head, 25)
                  );
                  respawnQueueRef.current.push({ snake: snakeA, timer: 240 });
                  break;
                }
              }
            }

            if (!snakeA.isAlive) break;
          }
        }

        // 7. Process AI Snake Respawns
        for (let i = respawnQueueRef.current.length - 1; i >= 0; i--) {
          const item = respawnQueueRef.current[i];
          item.timer -= 1;
          if (item.timer <= 0) {
            const newSnake = respawnAISnake(item.snake, snakesRef.current);
            const index = snakesRef.current.findIndex((s) => s.id === item.snake.id);
            if (index !== -1) {
              snakesRef.current[index] = newSnake;
            }
            respawnQueueRef.current.splice(i, 1);
          }
        }

        // 8. Update Particles
        const currentParticles = particlesRef.current;
        for (let i = currentParticles.length - 1; i >= 0; i--) {
          const p = currentParticles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.96;
          p.vy *= 0.96;
          p.life += 1;
          p.alpha = Math.max(0, 1 - p.life / p.maxLife);
          if (p.life >= p.maxLife) {
            currentParticles.splice(i, 1);
          }
        }

        // 9. Update Floating Texts
        const currentTexts = floatingTextsRef.current;
        for (let i = currentTexts.length - 1; i >= 0; i--) {
          const ft = currentTexts[i];
          ft.y -= 0.8;
          ft.life += 1;
          ft.alpha = Math.max(0, 1 - ft.life / 45);
          if (ft.life >= 45) {
            currentTexts.splice(i, 1);
          }
        }

        // 10. Periodically update Leaderboard state (every 30 frames / ~0.5s)
        tickCountRef.current += 1;
        if (tickCountRef.current % 30 === 0) {
          setLeaderboard(getLeaderboard(snakesRef.current));
          if (player) {
            setLength(player.segments.length);
          }
        }
      }

      // Synchronized rendering: draws immediately in the same frame as physics
      const activePlayer = snakesRef.current.find((s) => s.isPlayer) || snakesRef.current[0];
      canvasRef.current?.renderFrame(
        activePlayer,
        snakesRef.current,
        foodsRef.current,
        particlesRef.current,
        floatingTextsRef.current
      );

      animationFrameId = requestAnimationFrame(gameTick);
    };

    animationFrameId = requestAnimationFrame(gameTick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isGameStarted, isGameOver, isPaused, triggerGameOver]);

  return (
    <div
      id="neon-snake-arena-root"
      className="w-screen h-screen bg-[#050508] text-white flex flex-col p-2.5 sm:p-4 md:p-5 font-sans select-none overflow-hidden"
    >
      {/* Heads-up Display */}
      <HUD
        playerName={playerName || 'Player'}
        score={score}
        length={length}
        highScore={highScore}
        survivalTime={survivalTime}
        isPaused={isPaused}
        isMuted={isMuted}
        activeSnakesCount={snakesRef.current.filter((s) => s.isAlive).length}
        totalSnakesCount={snakesRef.current.length}
        onTogglePause={handleTogglePause}
        onToggleMute={handleToggleMute}
      />

      {/* Main Gameplay and Leaderboard Arena Area */}
      <main className="flex grow gap-4 sm:gap-6 min-h-0 relative">
        {/* Main Neon Arena Viewport Container */}
        <div className="relative grow bg-[#0a0a12] border-2 border-white/10 rounded-2xl overflow-hidden shadow-[inset_0_0_60px_rgba(0,0,0,0.8)] flex flex-col min-w-0">
          {/* Subtle Dot Matrix Pattern */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          {/* Vignette Overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(5,5,8,0.4) 100%)',
            }}
          />

          {/* Main Arcade Canvas */}
          <NeonCanvas ref={canvasRef} />

          {/* Control hints pill badge */}
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 bg-white/5 border border-white/10 backdrop-blur-md px-4 sm:px-6 py-1.5 sm:py-2 rounded-full flex gap-3 sm:gap-4 text-[10px] sm:text-xs font-medium tracking-widest uppercase opacity-40 hover:opacity-80 transition-opacity pointer-events-none z-10 whitespace-nowrap shadow-lg">
            <span>← Turn Left</span>
            <span>↑ Up</span>
            <span>↓ Down</span>
            <span>→ Turn Right</span>
          </div>

          {/* Pause Overlay inside Arena */}
          {isPaused && !isGameOver && (
            <div
              id="pause-overlay"
              className="absolute inset-0 z-40 flex items-center justify-center bg-black/75 backdrop-blur-md"
            >
              <div className="bg-[#0a0a12] border-2 border-cyan-400/60 rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_40px_rgba(34,211,238,0.3)]">
                <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-cyan-400 mb-1">
                  Arena Paused
                </div>
                <h3 className="text-2xl sm:text-3xl font-black italic tracking-tighter text-white mb-2 uppercase">
                  GAME PAUSED
                </h3>
                <p className="text-white/60 font-mono text-xs mb-6">
                  Press [P] or Space to resume
                </p>
                <button
                  type="button"
                  onClick={handleTogglePause}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-300 font-bold uppercase italic tracking-wider text-black shadow-[0_0_15px_#00f7ff] cursor-pointer"
                >
                  RESUME
                </button>
              </div>
            </div>
          )}

          {/* Mobile/Accessibility On-Screen Arrow Pad */}
          <div
            id="onscreen-arrows"
            className="absolute bottom-3 left-3 z-20 md:hidden pointer-events-auto bg-black/60 backdrop-blur-sm p-1.5 rounded-2xl border border-white/10 opacity-70 hover:opacity-100"
          >
            <div className="grid grid-cols-3 gap-1 w-28 h-28">
              <div />
              <button
                type="button"
                onClick={() => {
                  playerTargetAngleRef.current = -Math.PI / 2;
                }}
                className="bg-white/10 active:bg-cyan-400 active:text-black rounded-lg flex items-center justify-center font-bold text-white text-base cursor-pointer"
              >
                ↑
              </button>
              <div />
              <button
                type="button"
                onClick={() => {
                  playerTargetAngleRef.current = Math.PI;
                }}
                className="bg-white/10 active:bg-cyan-400 active:text-black rounded-lg flex items-center justify-center font-bold text-white text-base cursor-pointer"
              >
                ←
              </button>
              <div />
              <button
                type="button"
                onClick={() => {
                  playerTargetAngleRef.current = 0;
                }}
                className="bg-white/10 active:bg-cyan-400 active:text-black rounded-lg flex items-center justify-center font-bold text-white text-base cursor-pointer"
              >
                →
              </button>
              <div />
              <button
                type="button"
                onClick={() => {
                  playerTargetAngleRef.current = Math.PI / 2;
                }}
                className="bg-white/10 active:bg-cyan-400 active:text-black rounded-lg flex items-center justify-center font-bold text-white text-base cursor-pointer"
              >
                ↓
              </button>
              <div />
            </div>
          </div>
        </div>

        {/* Sidebar: Leaderboard & Arena Status (hidden on very small screens, visible on md+) */}
        <div className="hidden md:flex">
          <Leaderboard items={leaderboard} />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-2.5 sm:mt-3 pt-2 sm:pt-3 border-t border-white/5 flex justify-between items-center px-1 sm:px-2 opacity-50 text-[10px] sm:text-[11px] tracking-widest uppercase font-mono shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span>NEON SNAKE ARENA // ARROW KEYS TO NAVIGATE</span>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <span>ARENA: 2400x2400</span>
          <span>•</span>
          <span>60 FPS SMOOTH</span>
        </div>
      </footer>

      {/* Start Screen (Name Entry) */}
      {!isGameStarted && (
        <StartScreen
          initialName={playerName}
          onStartGame={handleStartGame}
        />
      )}

      {/* Game Over Screen */}
      {isGameOver && stats && (
        <GameOverModal
          stats={stats}
          playerName={playerName || 'Player'}
          highScore={highScore}
          onPlayAgain={() => initGame(playerName)}
          onChangePlayer={handleChangePlayer}
        />
      )}
    </div>
  );
}
