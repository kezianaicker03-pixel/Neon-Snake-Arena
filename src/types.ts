export interface Point {
  x: number;
  y: number;
}

export interface SnakeColor {
  name: string;
  head: string;
  body: string;
  glow: string;
  accent: string;
  tail: string;
}

export interface Snake {
  id: string;
  name: string;
  isPlayer: boolean;
  color: SnakeColor;
  segments: Point[];
  angle: number; // in radians
  targetAngle: number;
  speed: number;
  length: number; // target number of segments
  score: number;
  foodEaten: number;
  isAlive: boolean;
  // AI specific
  aiDecisionTimer?: number;
  turnRate?: number;
}

export interface Food {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  glowColor: string;
  points: number;
  isSpecial: boolean;
  pulseOffset: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  life: number;
}

export interface LeaderboardItem {
  id: string;
  name: string;
  isPlayer: boolean;
  length: number;
  score: number;
  color: string;
}

export interface GameStats {
  playerName: string;
  score: number;
  length: number;
  foodCollected: number;
  survivalTimeSeconds: number;
  deathReason: string;
}
