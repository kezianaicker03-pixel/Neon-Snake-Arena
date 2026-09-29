import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { FloatingText, Food, Particle, Snake } from '../types';
import {
  ARENA_HEIGHT,
  ARENA_WIDTH,
  BODY_RADIUS,
  HEAD_RADIUS,
  TAIL_RADIUS,
} from '../utils/constants';

export interface NeonCanvasHandle {
  renderFrame: (
    player: Snake | undefined,
    snakes: Snake[],
    foods: Food[],
    particles: Particle[],
    floatingTexts: FloatingText[]
  ) => void;
}

export interface NeonCanvasProps {
  className?: string;
}

export const NeonCanvas = React.memo(
  forwardRef<NeonCanvasHandle, NeonCanvasProps>(function NeonCanvas(
    { className },
    ref
  ) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const cameraRef = useRef<{ x: number; y: number }>({
      x: ARENA_WIDTH / 2,
      y: ARENA_HEIGHT / 2,
    });
    const timeRef = useRef(0);
    const lastFrameDataRef = useRef<{
      player: Snake | undefined;
      snakes: Snake[];
      foods: Food[];
      particles: Particle[];
      floatingTexts: FloatingText[];
    } | null>(null);

    const draw = (
      player: Snake | undefined,
      snakes: Snake[],
      foods: Food[],
      particles: Particle[],
      floatingTexts: FloatingText[]
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      lastFrameDataRef.current = { player, snakes, foods, particles, floatingTexts };
      timeRef.current += 0.03;
      const time = timeRef.current;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const viewWidth = canvas.width / dpr;
      const viewHeight = canvas.height / dpr;

      if (viewWidth <= 0 || viewHeight <= 0) return;

      // Smooth camera interpolation towards player head
      if (player && player.isAlive && player.segments.length > 0) {
        const targetX = player.segments[0].x;
        const targetY = player.segments[0].y;
        cameraRef.current.x += (targetX - cameraRef.current.x) * 0.12;
        cameraRef.current.y += (targetY - cameraRef.current.y) * 0.12;
      }

      // Clamp camera
      const camX = Math.max(
        viewWidth / 2,
        Math.min(ARENA_WIDTH - viewWidth / 2, cameraRef.current.x)
      );
      const camY = Math.max(
        viewHeight / 2,
        Math.min(ARENA_HEIGHT - viewHeight / 2, cameraRef.current.y)
      );

      ctx.save();
      ctx.scale(dpr, dpr);

      // Deep space arena background
      ctx.fillStyle = '#06070e';
      ctx.fillRect(0, 0, viewWidth, viewHeight);

      // Translate context by camera
      ctx.save();
      ctx.translate(viewWidth / 2 - camX, viewHeight / 2 - camY);

      // Camera view bounds for culling
      const margin = 100;
      const minX = camX - viewWidth / 2 - margin;
      const maxX = camX + viewWidth / 2 + margin;
      const minY = camY - viewHeight / 2 - margin;
      const maxY = camY + viewHeight / 2 + margin;

      // 1. Draw Arena Floor & Neon Cyber Grid (Culled to visible viewport)
      drawArenaFloor(ctx, time, minX, maxX, minY, maxY);

      // 2. Draw Food Items (Culled to visible viewport)
      drawFoods(ctx, foods, time, minX, maxX, minY, maxY);

      // 3. Draw All Snakes (AI snakes first, player snake on top)
      const sortedSnakes = [...snakes].sort((a, b) => (a.isPlayer ? 1 : b.isPlayer ? -1 : 0));
      for (const snake of sortedSnakes) {
        if (snake.isAlive) {
          drawSnake(ctx, snake, time);
        }
      }

      // 4. Draw Particles
      drawParticles(ctx, particles);

      // 5. Draw Floating Texts
      drawFloatingTexts(ctx, floatingTexts);

      // 6. Draw Arena Outer Glowing Borders
      drawArenaBorders(ctx, time);

      ctx.restore(); // restore camera transform

      // 7. Draw Minimap (Fixed screen overlay)
      if (player) {
        drawMinimap(ctx, viewWidth, viewHeight, player, snakes, foods);
      }

      ctx.restore(); // restore dpr scale
    };

    useImperativeHandle(
      ref,
      () => ({
        renderFrame: draw,
      }),
      []
    );

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const handleResize = () => {
        const rect = canvas.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const targetW = Math.floor(rect.width * dpr);
        const targetH = Math.floor(rect.height * dpr);

        // ONLY update width and height if dimensions actually changed
        // Setting canvas.width clears the canvas buffer, so avoiding redundant assignments prevents flickering
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
          if (lastFrameDataRef.current) {
            const { player, snakes, foods, particles, floatingTexts } = lastFrameDataRef.current;
            draw(player, snakes, foods, particles, floatingTexts);
          }
        }
      };

      const resizeObserver = new ResizeObserver(() => handleResize());
      resizeObserver.observe(canvas);
      handleResize();

      return () => {
        resizeObserver.disconnect();
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        id="neon-game-canvas"
        className={`w-full h-full block select-none touch-none cursor-crosshair ${className || ''}`}
      />
    );
  })
);

// Helper: Draw arena floor and neon grid
function drawArenaFloor(
  ctx: CanvasRenderingContext2D,
  time: number,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number
) {
  // Dark arena base
  ctx.fillStyle = '#080914';
  ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

  // Subtle radial center ambient glow
  const centerGlow = ctx.createRadialGradient(
    ARENA_WIDTH / 2,
    ARENA_HEIGHT / 2,
    50,
    ARENA_WIDTH / 2,
    ARENA_HEIGHT / 2,
    ARENA_WIDTH * 0.7
  );
  centerGlow.addColorStop(0, 'rgba(0, 180, 255, 0.04)');
  centerGlow.addColorStop(0.5, 'rgba(188, 19, 254, 0.02)');
  centerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = centerGlow;
  ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

  // Grid lines culled to visible camera range
  const gridSize = 60;
  const startX = Math.max(0, Math.floor(minX / gridSize) * gridSize);
  const endX = Math.min(ARENA_WIDTH, Math.ceil(maxX / gridSize) * gridSize);
  const startY = Math.max(0, Math.floor(minY / gridSize) * gridSize);
  const endY = Math.min(ARENA_HEIGHT, Math.ceil(maxY / gridSize) * gridSize);

  ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();

  for (let x = startX; x <= endX; x += gridSize) {
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
  }
  for (let y = startY; y <= endY; y += gridSize) {
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
  }
  ctx.stroke();

  // Grid intersection dots in visible range
  ctx.fillStyle = 'rgba(0, 240, 255, 0.12)';
  const dotStep = gridSize * 2;
  const dotStartX = Math.max(gridSize, Math.floor(minX / dotStep) * dotStep + gridSize);
  const dotEndX = Math.min(ARENA_WIDTH, Math.ceil(maxX / dotStep) * dotStep);
  const dotStartY = Math.max(gridSize, Math.floor(minY / dotStep) * dotStep + gridSize);
  const dotEndY = Math.min(ARENA_HEIGHT, Math.ceil(maxY / dotStep) * dotStep);

  for (let x = dotStartX; x < dotEndX; x += dotStep) {
    for (let y = dotStartY; y < dotEndY; y += dotStep) {
      ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
    }
  }
}

// Helper: Draw pulsing neon arena boundary borders
function drawArenaBorders(ctx: CanvasRenderingContext2D, time: number) {
  const borderWidth = 6;

  // Outer safety line (stable high-contrast neon glow)
  ctx.save();
  ctx.shadowColor = '#00f7ff';
  ctx.shadowBlur = 14;
  ctx.strokeStyle = 'rgba(0, 247, 255, 0.85)';
  ctx.lineWidth = borderWidth;
  ctx.strokeRect(borderWidth / 2, borderWidth / 2, ARENA_WIDTH - borderWidth, ARENA_HEIGHT - borderWidth);

  // Inner secondary hazard border
  ctx.shadowColor = '#ff007f';
  ctx.shadowBlur = 10;
  ctx.strokeStyle = 'rgba(255, 0, 127, 0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, ARENA_WIDTH - 36, ARENA_HEIGHT - 36);

  // Corner tech brackets
  const cornerSize = 40;
  const corners = [
    [borderWidth, borderWidth, 1, 1],
    [ARENA_WIDTH - borderWidth, borderWidth, -1, 1],
    [borderWidth, ARENA_HEIGHT - borderWidth, 1, -1],
    [ARENA_WIDTH - borderWidth, ARENA_HEIGHT - borderWidth, -1, -1],
  ];

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 12;

  for (const [cx, cy, sx, sy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + sy * cornerSize);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + sx * cornerSize, cy);
    ctx.stroke();
  }

  ctx.restore();
}

// Helper: Draw glowing foods
function drawFoods(
  ctx: CanvasRenderingContext2D,
  foods: Food[],
  time: number,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number
) {
  for (const food of foods) {
    // Cull foods outside visible screen
    if (food.x < minX || food.x > maxX || food.y < minY || food.y > maxY) {
      continue;
    }

    ctx.save();

    const pulse = Math.sin(time * 3 + food.pulseOffset) * 0.25 + 1;
    const currentRadius = food.radius * pulse;

    if (food.isSpecial) {
      ctx.shadowColor = '#ffe600';
      ctx.shadowBlur = 16;

      // 50-point special glowing star/gem orb
      const grad = ctx.createRadialGradient(food.x, food.y, 1, food.x, food.y, currentRadius * 1.5);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#fff455');
      grad.addColorStop(0.7, '#ff8800');
      grad.addColorStop(1, 'rgba(255, 136, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(food.x, food.y, currentRadius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Core white diamond
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(food.x, food.y, currentRadius * 0.7, 0, Math.PI * 2);
      ctx.fill();

      // Outer rotating halo ring
      ctx.strokeStyle = 'rgba(255, 230, 0, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(food.x, food.y, currentRadius * 1.8, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.shadowColor = food.glowColor;
      ctx.shadowBlur = 10;

      // 10-point standard neon food piece
      const grad = ctx.createRadialGradient(food.x, food.y, 0, food.x, food.y, currentRadius * 1.3);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, food.color);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(food.x, food.y, currentRadius * 1.3, 0, Math.PI * 2);
      ctx.fill();

      // Bright solid core
      ctx.fillStyle = food.color;
      ctx.beginPath();
      ctx.arc(food.x, food.y, currentRadius * 0.65, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// Helper: Draw a snake with connected circular segments, glowing head, and eyes
function drawSnake(ctx: CanvasRenderingContext2D, snake: Snake, time: number) {
  const segs = snake.segments;
  if (segs.length === 0) return;

  ctx.save();

  // 1. Draw glowing connecting spline / spine behind segments
  if (segs.length > 1) {
    ctx.save();
    ctx.shadowColor = snake.color.glow;
    ctx.shadowBlur = snake.isPlayer ? 18 : 12;
    ctx.strokeStyle = snake.color.body;
    ctx.lineWidth = BODY_RADIUS * 1.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(segs[0].x, segs[0].y);
    for (let i = 1; i < segs.length; i++) {
      ctx.lineTo(segs[i].x, segs[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // 2. Draw circular body segments from tail to head
  for (let i = segs.length - 1; i >= 1; i--) {
    const seg = segs[i];
    const progress = i / segs.length; // 0 near head, 1 at tail
    const radius = HEAD_RADIUS - (HEAD_RADIUS - TAIL_RADIUS) * progress;

    ctx.save();
    ctx.shadowColor = snake.color.glow;
    ctx.shadowBlur = 8;

    // Segment color gradient
    const segGrad = ctx.createRadialGradient(seg.x, seg.y, 0, seg.x, seg.y, radius);
    segGrad.addColorStop(0, '#ffffff');
    segGrad.addColorStop(0.35, snake.color.body);
    segGrad.addColorStop(1, snake.color.tail);

    ctx.fillStyle = segGrad;
    ctx.beginPath();
    ctx.arc(seg.x, seg.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright center dot for high-tech neon segment look
    ctx.fillStyle = snake.isPlayer ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(seg.x, seg.y, radius * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 3. Draw Snake Head (Larger than body, distinct direction, forward glowing eyes)
  const head = segs[0];
  ctx.save();
  ctx.shadowColor = snake.color.glow;
  ctx.shadowBlur = snake.isPlayer ? 24 : 16;

  // Head base orb
  const headGrad = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, HEAD_RADIUS * 1.2);
  headGrad.addColorStop(0, '#ffffff');
  headGrad.addColorStop(0.4, snake.color.head);
  headGrad.addColorStop(1, snake.color.body);

  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.arc(head.x, head.y, HEAD_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  // Head neon border ring
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Eyes facing snake's heading angle
  const eyeDistance = 6.5;
  const eyeOffsetAngle = 0.55;
  const eyeRadius = 3.2;

  const leftEyeX = head.x + Math.cos(snake.angle - eyeOffsetAngle) * eyeDistance;
  const leftEyeY = head.y + Math.sin(snake.angle - eyeOffsetAngle) * eyeDistance;
  const rightEyeX = head.x + Math.cos(snake.angle + eyeOffsetAngle) * eyeDistance;
  const rightEyeY = head.y + Math.sin(snake.angle + eyeOffsetAngle) * eyeDistance;

  // Eye whites
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(leftEyeX, leftEyeY, eyeRadius, 0, Math.PI * 2);
  ctx.arc(rightEyeX, rightEyeY, eyeRadius, 0, Math.PI * 2);
  ctx.fill();

  // Eye pupils facing forward
  const pupilDist = 1.4;
  const pupilRadius = 1.8;
  ctx.fillStyle = '#06070e';
  ctx.beginPath();
  ctx.arc(
    leftEyeX + Math.cos(snake.angle) * pupilDist,
    leftEyeY + Math.sin(snake.angle) * pupilDist,
    pupilRadius,
    0,
    Math.PI * 2
  );
  ctx.arc(
    rightEyeX + Math.cos(snake.angle) * pupilDist,
    rightEyeY + Math.sin(snake.angle) * pupilDist,
    pupilRadius,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Head name tag badge floating above head
  ctx.shadowBlur = 0;
  ctx.font = 'bold 10px Orbitron, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = snake.isPlayer ? '#00f7ff' : '#ffffff';
  ctx.fillText(snake.name, head.x, head.y - HEAD_RADIUS - 6);

  ctx.restore();

  ctx.restore();
}

// Helper: Draw particles
function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Helper: Draw floating text
function drawFloatingTexts(ctx: CanvasRenderingContext2D, floatingTexts: FloatingText[]) {
  for (const ft of floatingTexts) {
    ctx.save();
    ctx.globalAlpha = ft.alpha;
    ctx.font = 'bold 15px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = ft.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  }
}

// Helper: Draw minimap radar in bottom right
function drawMinimap(
  ctx: CanvasRenderingContext2D,
  viewWidth: number,
  viewHeight: number,
  player: Snake,
  snakes: Snake[],
  foods: Food[]
) {
  const mapW = 160;
  const mapH = (mapW / ARENA_WIDTH) * ARENA_HEIGHT;
  const pad = 16;
  const mapX = viewWidth - mapW - pad;
  const mapY = viewHeight - mapH - pad;

  ctx.save();

  // Minimap background box
  ctx.fillStyle = 'rgba(6, 7, 14, 0.85)';
  ctx.strokeStyle = 'rgba(0, 247, 255, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.shadowColor = '#00f7ff';
  ctx.shadowBlur = 8;
  ctx.fillRect(mapX, mapY, mapW, mapH);
  ctx.strokeRect(mapX, mapY, mapW, mapH);

  // Label "RADAR"
  ctx.shadowBlur = 0;
  ctx.font = '700 9px Orbitron, sans-serif';
  ctx.fillStyle = 'rgba(0, 247, 255, 0.7)';
  ctx.fillText('RADAR', mapX + 6, mapY + 12);

  const scaleX = mapW / ARENA_WIDTH;
  const scaleY = mapH / ARENA_HEIGHT;

  // Minimap food dots (special food highlighted)
  for (const f of foods) {
    if (f.isSpecial) {
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(mapX + f.x * scaleX - 1, mapY + f.y * scaleY - 1, 2.5, 2.5);
    }
  }

  // Minimap AI snakes
  for (const s of snakes) {
    if (!s.isAlive || s.segments.length === 0) continue;
    ctx.fillStyle = s.color.head;
    const hx = mapX + s.segments[0].x * scaleX;
    const hy = mapY + s.segments[0].y * scaleY;
    ctx.beginPath();
    ctx.arc(hx, hy, s.isPlayer ? 3.5 : 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Player ping ring
  if (player.isAlive && player.segments.length > 0) {
    const px = mapX + player.segments[0].x * scaleX;
    const py = mapY + player.segments[0].y * scaleY;
    ctx.strokeStyle = '#00f7ff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}
