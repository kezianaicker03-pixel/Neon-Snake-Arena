import { SnakeColor } from '../types';

export const ARENA_WIDTH = 2200;
export const ARENA_HEIGHT = 1500;

export const INITIAL_PLAYER_LENGTH = 16;
export const INITIAL_AI_LENGTH = 14;
export const SEGMENT_SPACING = 8.5;

export const HEAD_RADIUS = 13.5;
export const BODY_RADIUS = 9.5;
export const TAIL_RADIUS = 6.0;

export const PLAYER_SPEED = 4.3;
export const AI_BASE_SPEED = 3.9;

export const TOTAL_FOOD_COUNT = 90;
export const SPECIAL_FOOD_CHANCE = 0.12; // ~12% special food

export const SNAKE_COLORS: Record<string, SnakeColor> = {
  player: {
    name: 'Player',
    head: '#00f7ff',
    body: '#00c3ff',
    glow: '#00f7ff',
    accent: '#ffffff',
    tail: '#0077ff',
  },
  snake2: {
    name: 'Snake 2',
    head: '#ff007f',
    body: '#ff3399',
    glow: '#ff007f',
    accent: '#ffffff',
    tail: '#b30059',
  },
  snake3: {
    name: 'Snake 3',
    head: '#39ff14',
    body: '#00e676',
    glow: '#39ff14',
    accent: '#ffffff',
    tail: '#009944',
  },
  snake4: {
    name: 'Snake 4',
    head: '#ffaa00',
    body: '#ff7700',
    glow: '#ffaa00',
    accent: '#ffffff',
    tail: '#cc5500',
  },
  snake5: {
    name: 'Snake 5',
    head: '#bc13fe',
    body: '#9d00ff',
    glow: '#bc13fe',
    accent: '#ffffff',
    tail: '#5b00b3',
  },
};

export const FOOD_COLORS = [
  { color: '#00ffff', glow: 'rgba(0, 255, 255, 0.8)' },
  { color: '#ff007f', glow: 'rgba(255, 0, 127, 0.8)' },
  { color: '#39ff14', glow: 'rgba(57, 255, 20, 0.8)' },
  { color: '#ffff00', glow: 'rgba(255, 255, 0, 0.8)' },
  { color: '#ff6600', glow: 'rgba(255, 102, 0, 0.8)' },
  { color: '#b026ff', glow: 'rgba(176, 38, 255, 0.8)' },
];
