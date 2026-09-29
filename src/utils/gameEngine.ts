import {
  ARENA_HEIGHT,
  ARENA_WIDTH,
  BODY_RADIUS,
  FOOD_COLORS,
  HEAD_RADIUS,
  INITIAL_AI_LENGTH,
  INITIAL_PLAYER_LENGTH,
  PLAYER_SPEED,
  SEGMENT_SPACING,
  SNAKE_COLORS,
  SPECIAL_FOOD_CHANCE,
  TOTAL_FOOD_COUNT,
} from './constants';
import { FloatingText, Food, LeaderboardItem, Particle, Point, Snake } from '../types';

let nextFoodId = 1;
let nextTextId = 1;

export function createFood(
  id?: string,
  x?: number,
  y?: number,
  forceSpecial?: boolean
): Food {
  const isSpecial = forceSpecial ?? (Math.random() < SPECIAL_FOOD_CHANCE);
  const colorObj = FOOD_COLORS[Math.floor(Math.random() * FOOD_COLORS.length)];
  const pad = 60;

  return {
    id: id || `food_${nextFoodId++}`,
    x: x ?? pad + Math.random() * (ARENA_WIDTH - pad * 2),
    y: y ?? pad + Math.random() * (ARENA_HEIGHT - pad * 2),
    radius: isSpecial ? 10.5 : 5.5 + Math.random() * 2,
    color: isSpecial ? '#ffffff' : colorObj.color,
    glowColor: isSpecial ? '#ffe600' : colorObj.glow,
    points: isSpecial ? 50 : 10,
    isSpecial,
    pulseOffset: Math.random() * Math.PI * 2,
  };
}

export function initFoodList(): Food[] {
  const foods: Food[] = [];
  for (let i = 0; i < TOTAL_FOOD_COUNT; i++) {
    foods.push(createFood(`food_${nextFoodId++}`));
  }
  return foods;
}

export function createSnake(
  id: string,
  name: string,
  colorKey: string,
  isPlayer: boolean,
  startX: number,
  startY: number,
  startAngle: number,
  initialLength: number
): Snake {
  const segments: Point[] = [];
  for (let i = 0; i < initialLength; i++) {
    segments.push({
      x: startX - Math.cos(startAngle) * (i * SEGMENT_SPACING),
      y: startY - Math.sin(startAngle) * (i * SEGMENT_SPACING),
    });
  }

  return {
    id,
    name,
    isPlayer,
    color: SNAKE_COLORS[colorKey],
    segments,
    angle: startAngle,
    targetAngle: startAngle,
    speed: isPlayer ? PLAYER_SPEED : 3.8 + Math.random() * 0.4,
    length: initialLength,
    score: 0,
    foodEaten: 0,
    isAlive: true,
    aiDecisionTimer: Math.random() * 60,
    turnRate: 0.12,
  };
}

export function initSnakes(playerName = 'Player'): Snake[] {
  const snakes: Snake[] = [];

  // Player in center
  snakes.push(
    createSnake(
      'player',
      playerName,
      'player',
      true,
      ARENA_WIDTH / 2,
      ARENA_HEIGHT / 2,
      0, // moving right initially
      INITIAL_PLAYER_LENGTH
    )
  );

  // 4 AI snakes positioned in surrounding sectors
  const aiConfigs = [
    { id: 'snake_2', name: 'Snake 2', key: 'snake2', x: 400, y: 350, angle: 0.8 },
    { id: 'snake_3', name: 'Snake 3', key: 'snake3', x: ARENA_WIDTH - 450, y: 400, angle: 2.3 },
    { id: 'snake_4', name: 'Snake 4', key: 'snake4', x: 450, y: ARENA_HEIGHT - 400, angle: -0.6 },
    { id: 'snake_5', name: 'Snake 5', key: 'snake5', x: ARENA_WIDTH - 400, y: ARENA_HEIGHT - 350, angle: -2.4 },
  ];

  for (const cfg of aiConfigs) {
    snakes.push(
      createSnake(
        cfg.id,
        cfg.name,
        cfg.key,
        false,
        cfg.x,
        cfg.y,
        cfg.angle,
        INITIAL_AI_LENGTH
      )
    );
  }

  return snakes;
}

// Respawns an eliminated AI snake in a safe position
export function respawnAISnake(snake: Snake, otherSnakes: Snake[]): Snake {
  let bestX = 400;
  let bestY = 400;
  let maxDistToPlayer = 0;

  // Try several candidate points far from player
  const player = otherSnakes.find(s => s.isPlayer && s.isAlive);
  const px = player ? player.segments[0].x : ARENA_WIDTH / 2;
  const py = player ? player.segments[0].y : ARENA_HEIGHT / 2;

  for (let i = 0; i < 8; i++) {
    const cx = 200 + Math.random() * (ARENA_WIDTH - 400);
    const cy = 200 + Math.random() * (ARENA_HEIGHT - 400);
    const dist = Math.hypot(cx - px, cy - py);
    if (dist > maxDistToPlayer) {
      maxDistToPlayer = dist;
      bestX = cx;
      bestY = cy;
    }
  }

  const newAngle = Math.random() * Math.PI * 2;
  const newSnake = createSnake(
    snake.id,
    snake.name,
    snake.id === 'snake_2' ? 'snake2' :
    snake.id === 'snake_3' ? 'snake3' :
    snake.id === 'snake_4' ? 'snake4' : 'snake5',
    false,
    bestX,
    bestY,
    newAngle,
    INITIAL_AI_LENGTH
  );

  return newSnake;
}

// Angle difference normalized to [-PI, PI]
export function angleDiff(a: number, b: number): number {
  let diff = b - a;
  while (diff < -Math.PI) diff += Math.PI * 2;
  while (diff > Math.PI) diff -= Math.PI * 2;
  return diff;
}

// Updates an AI snake's heading target
export function updateAISteering(snake: Snake, foods: Food[], allSnakes: Snake[]): void {
  if (!snake.isAlive || snake.segments.length === 0) return;

  const head = snake.segments[0];

  // 1. Arena Boundary Avoidance (Highest priority)
  const margin = 140;
  let avoidAngle: number | null = null;

  if (head.x < margin) {
    avoidAngle = 0; // go right
  } else if (head.x > ARENA_WIDTH - margin) {
    avoidAngle = Math.PI; // go left
  } else if (head.y < margin) {
    avoidAngle = Math.PI / 2; // go down
  } else if (head.y > ARENA_HEIGHT - margin) {
    avoidAngle = -Math.PI / 2; // go up
  }

  if (avoidAngle !== null) {
    snake.targetAngle = avoidAngle;
    const diff = angleDiff(snake.angle, snake.targetAngle);
    snake.angle += Math.sign(diff) * Math.min(Math.abs(diff), 0.15);
    return;
  }

  // 2. Snake Avoidance: look ahead for other snakes
  const lookAheadDist = 60;
  const lookX = head.x + Math.cos(snake.angle) * lookAheadDist;
  const lookY = head.y + Math.sin(snake.angle) * lookAheadDist;

  let imminentDanger = false;
  for (const other of allSnakes) {
    if (!other.isAlive) continue;
    const startIndex = other.id === snake.id ? 4 : 1;
    for (let i = startIndex; i < other.segments.length; i += 2) {
      const seg = other.segments[i];
      if (Math.hypot(lookX - seg.x, lookY - seg.y) < 32) {
        imminentDanger = true;
        // Turn sharply 90 degrees away
        snake.targetAngle = snake.angle + Math.PI / 2;
        break;
      }
    }
    if (imminentDanger) break;
  }

  if (imminentDanger) {
    const diff = angleDiff(snake.angle, snake.targetAngle);
    snake.angle += Math.sign(diff) * Math.min(Math.abs(diff), 0.18);
    return;
  }

  // 3. Move toward nearby food
  snake.aiDecisionTimer = (snake.aiDecisionTimer || 0) - 1;
  if (snake.aiDecisionTimer <= 0) {
    snake.aiDecisionTimer = 25 + Math.random() * 30;

    let nearestFood: Food | null = null;
    let minDist = 320; // detection radius

    for (const food of foods) {
      const d = Math.hypot(food.x - head.x, food.y - head.y);
      if (d < minDist) {
        minDist = d;
        nearestFood = food;
      }
    }

    if (nearestFood) {
      snake.targetAngle = Math.atan2(nearestFood.y - head.y, nearestFood.x - head.x);
    } else {
      // Occasional random wander drift
      snake.targetAngle = snake.angle + (Math.random() - 0.5) * 0.9;
    }
  }

  // Smooth turn toward target angle
  const diff = angleDiff(snake.angle, snake.targetAngle);
  const turnSpeed = snake.turnRate || 0.12;
  snake.angle += Math.sign(diff) * Math.min(Math.abs(diff), turnSpeed);
}

// Moves a snake forward and updates its segments with inverse kinematics
export function moveSnake(snake: Snake): void {
  if (!snake.isAlive || snake.segments.length === 0) return;

  const head = snake.segments[0];
  const newHeadX = head.x + Math.cos(snake.angle) * snake.speed;
  const newHeadY = head.y + Math.sin(snake.angle) * snake.speed;

  // Insert new head
  snake.segments[0] = { x: newHeadX, y: newHeadY };

  // Pull subsequent segments
  for (let i = 1; i < snake.segments.length; i++) {
    const prev = snake.segments[i - 1];
    const curr = snake.segments[i];

    const dx = prev.x - curr.x;
    const dy = prev.y - curr.y;
    const dist = Math.hypot(dx, dy);

    if (dist > SEGMENT_SPACING) {
      const angle = Math.atan2(dy, dx);
      curr.x = prev.x - Math.cos(angle) * SEGMENT_SPACING;
      curr.y = prev.y - Math.sin(angle) * SEGMENT_SPACING;
    }
  }

  // Growth: if target length exceeds current segment count, append segment at tail
  if (snake.length > snake.segments.length) {
    const last = snake.segments[snake.segments.length - 1];
    snake.segments.push({ x: last.x, y: last.y });
  }
}

// Check food collection
export function checkFoodCollisions(
  snake: Snake,
  foods: Food[],
  onEatFood: (food: Food) => void
): Food[] {
  if (!snake.isAlive || snake.segments.length === 0) return foods;

  const head = snake.segments[0];
  const eatRadius = HEAD_RADIUS + 8;
  const remainingFoods: Food[] = [];

  for (const food of foods) {
    const dist = Math.hypot(food.x - head.x, food.y - head.y);
    if (dist < eatRadius + food.radius) {
      // Eat food
      snake.score += food.points;
      snake.foodEaten += 1;
      // Normal food: +2 segments; special: +5 segments
      snake.length += food.isSpecial ? 5 : 2;
      onEatFood(food);
    } else {
      remainingFoods.push(food);
    }
  }

  return remainingFoods;
}

// Convert eliminated snake segments into glowing food pieces
export function convertSnakeToFood(snake: Snake): Food[] {
  const drops: Food[] = [];
  // Sample every 2nd or 3rd segment
  for (let i = 0; i < snake.segments.length; i += 2) {
    const seg = snake.segments[i];
    drops.push(
      createFood(
        `drop_${snake.id}_${i}_${nextFoodId++}`,
        seg.x + (Math.random() - 0.5) * 16,
        seg.y + (Math.random() - 0.5) * 16,
        false
      )
    );
  }
  return drops;
}

// Particle explosion
export function createExplosion(x: number, y: number, color: string, count = 25): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const speed = 2 + Math.random() * 6;
    const angle = Math.random() * Math.PI * 2;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 2 + Math.random() * 3.5,
      color,
      alpha: 1,
      life: 0,
      maxLife: 25 + Math.random() * 20,
    });
  }
  return particles;
}

// Floating score text
export function createFloatingText(x: number, y: number, text: string, color: string): FloatingText {
  return {
    id: `ft_${nextTextId++}`,
    x,
    y,
    text,
    color,
    alpha: 1,
    life: 0,
  };
}

// Computes current sorted leaderboard by snake length
export function getLeaderboard(snakes: Snake[]): LeaderboardItem[] {
  return snakes
    .filter(s => s.isAlive)
    .map(s => ({
      id: s.id,
      name: s.name,
      isPlayer: s.isPlayer,
      length: s.segments.length,
      score: s.score,
      color: s.color.head,
    }))
    .sort((a, b) => b.length - a.length || b.score - a.score);
}
