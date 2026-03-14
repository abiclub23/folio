import { useEffect, useRef, useCallback } from 'react';

// ─── Pixel Art Sprites ─────────────────────────────────────────────────────────
// '#' = body, '@' = accent/eyes, ' ' = transparent
// Each sprite is 9 chars wide × 8 rows tall
const SPRITES = {
  A: [  // Nano Bot – top rows – 10 pts (orange)
    ' ##   ## ',
    '#########',
    '#@#   #@#',
    '#########',
    '## ___ ##',
    '#########',
    ' # ### # ',
    '  #   #  ',
  ],
  B: [  // Dev Bot – mid rows – 20 pts (purple)
    '  #   #  ',
    '#########',
    '#@#   #@#',
    '#########',
    '#{>___}##',
    '#########',
    '# ## ## #',
    ' ##   ## ',
  ],
  C: [  // Opus Bot – bottom row – 30 pts (green)
    '### # ###',
    '#########',
    '#@## ##@#',
    '#########',
    '# {___} #',
    '#########',
    '## # # ##',
    ' ##   ## ',
  ],
};

// ─── Boss Sprite (drawn procedurally, 3× scale) ────────────────────────────────
// Boss is rendered with custom draw logic in renderBoss()

// ─── Code bomb characters ──────────────────────────────────────────────────────
const BOMB_CHARS = ['{}', '//', '=>', 'fn', '<>'];

// ─── Colours ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#0a0a0f',
  player: '#22d3ee',
  playerAccent: '#0891b2',
  bullet: '#fbbf24',
  A: { body: '#f97316', accent: '#fdba74' },
  B: { body: '#a855f7', accent: '#d8b4fe' },
  C: { body: '#22c55e', accent: '#86efac' },
  boss: { body: '#ef4444', accent: '#fca5a5', bar: '#22c55e' },
  bomb: '#f87171',
  shield: 'rgba(59,130,246,0.25)',
  shieldBorder: '#60a5fa',
  hud: '#e2e8f0',
  think: '#fbbf24',
  star: '#ffffff',
  dim: '#6b7280',
};

// ─── Virtual resolution & constants ────────────────────────────────────────────
const VW = 800;
const VH = 600;
const COLS = 11;
const ROWS = 5;
const INV_W = 44;          // invader cell width (virtual px)
const INV_H = 36;          // invader cell height
const INV_TOP = 80;        // top margin for invader grid
const INV_LEFT = 60;       // left margin
const PIXEL = 3;           // virtual px per sprite pixel (9×3 = 27px wide)
const SPRITE_W = 9 * PIXEL;
const SPRITE_H = 8 * PIXEL;
const PLAYER_W = 48;
const PLAYER_H = 28;
const BULLET_SPEED = 9;
const PLAYER_SPEED = 5;
const SHOOT_COOLDOWN = 15;
const SHIELD_DURATION = 180; // 3 s at 60 fps
const INIT_MOVE_INTERVAL = 50;
const INIT_BOMB_INTERVAL = 120;

export default function SpaceInvaders() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const animRef = useRef(null);
  const keysRef = useRef({});
  const scRef = useRef(1); // scale: canvas px per virtual px

  // ─── Draw a sprite ──────────────────────────────────────────────────────────
  const drawSprite = useCallback((ctx, type, vx, vy, body, accent) => {
    const ps = PIXEL * scRef.current;
    const px = Math.round(vx * scRef.current);
    const py = Math.round(vy * scRef.current);
    SPRITES[type].forEach((row, ry) => {
      [...row].forEach((ch, rx) => {
        if (ch === ' ') return;
        ctx.fillStyle = ch === '@' ? accent : body;
        ctx.fillRect(px + Math.round(rx * ps), py + Math.round(ry * ps), Math.ceil(ps), Math.ceil(ps));
      });
    });
  }, []);

  // ─── Draw player ship ───────────────────────────────────────────────────────
  const drawPlayer = useCallback((ctx, vx, vy) => {
    const sc = scRef.current;
    const x = vx * sc, y = vy * sc;
    const w = PLAYER_W * sc, h = PLAYER_H * sc;
    // Hull
    ctx.fillStyle = C.player;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.fill();
    // Cockpit
    ctx.fillStyle = C.playerAccent;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.6, h * 0.18, 0, Math.PI * 2);
    ctx.fill();
    // Wing nubs
    ctx.fillStyle = C.playerAccent;
    ctx.fillRect(x + w * 0.05, y + h * 0.72, w * 0.18, h * 0.18);
    ctx.fillRect(x + w * 0.77, y + h * 0.72, w * 0.18, h * 0.18);
  }, []);

  // ─── Draw boss ──────────────────────────────────────────────────────────────
  const drawBoss = useCallback((ctx, boss, frame) => {
    const sc = scRef.current;
    const bx = boss.x * sc, by = boss.y * sc;
    const bw = boss.w * sc, bh = boss.h * sc;

    // Body
    ctx.fillStyle = C.boss.body;
    ctx.fillRect(bx, by, bw, bh);

    // Pixel detail lines
    ctx.fillStyle = C.boss.accent;
    ctx.fillRect(bx + bw * 0.05, by + bh * 0.05, bw * 0.9, bh * 0.08); // top bar

    // Eyes (blink every 60 frames)
    const eyeOpen = (frame % 60) < 50;
    if (eyeOpen) {
      ctx.fillRect(bx + bw * 0.12, by + bh * 0.2, bw * 0.25, bh * 0.25);
      ctx.fillRect(bx + bw * 0.63, by + bh * 0.2, bw * 0.25, bh * 0.25);
    } else {
      ctx.fillRect(bx + bw * 0.12, by + bh * 0.3, bw * 0.25, bh * 0.06);
      ctx.fillRect(bx + bw * 0.63, by + bh * 0.3, bw * 0.25, bh * 0.06);
    }

    // Mouth / terminal prompt
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(bx + bw * 0.15, by + bh * 0.6, bw * 0.7, bh * 0.2);
    ctx.fillStyle = C.boss.accent;
    ctx.font = `bold ${10 * sc}px monospace`;
    ctx.fillText('>_', bx + bw * 0.18, by + bh * 0.75);

    // Antennae
    ctx.fillStyle = C.boss.body;
    ctx.fillRect(bx + bw * 0.28, by - 16 * sc, 5 * sc, 16 * sc);
    ctx.fillRect(bx + bw * 0.67, by - 16 * sc, 5 * sc, 16 * sc);
    // Antenna tips
    ctx.fillStyle = C.boss.accent;
    ctx.beginPath();
    ctx.arc(bx + bw * 0.285 + 2.5 * sc, by - 16 * sc, 5 * sc, 0, Math.PI * 2);
    ctx.arc(bx + bw * 0.675 + 2.5 * sc, by - 16 * sc, 5 * sc, 0, Math.PI * 2);
    ctx.fill();

    // Context Window HP bar
    const barY = by - 32 * sc;
    const barH = 14 * sc;
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(bx, barY, bw, barH);
    const fillW = (boss.hp / boss.maxHp) * bw;
    // Colour shifts red as HP drops
    const hpRatio = boss.hp / boss.maxHp;
    ctx.fillStyle = hpRatio > 0.5 ? C.boss.bar : hpRatio > 0.25 ? '#eab308' : '#ef4444';
    ctx.fillRect(bx, barY, fillW, barH);
    ctx.fillStyle = '#f1f5f9';
    ctx.font = `bold ${9 * sc}px monospace`;
    ctx.fillText(`CONTEXT WINDOW  ${boss.hp}/${boss.maxHp}`, bx + 4 * sc, barY + 10 * sc);

    // Boss bullets
    ctx.font = `bold ${13 * sc}px monospace`;
    ctx.fillStyle = C.boss.accent;
    for (const bb of boss.bullets) {
      ctx.fillText('◆', bb.x * sc - 5 * sc, bb.y * sc);
    }
  }, []);

  // ─── Build invader grid ─────────────────────────────────────────────────────
  const buildInvaders = () => {
    const inv = [];
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const type = row < 2 ? 'A' : row < 4 ? 'B' : 'C';
        const pts = row < 2 ? 10 : row < 4 ? 20 : 30;
        inv.push({
          col, row, type, pts,
          x: INV_LEFT + col * INV_W,
          y: INV_TOP + row * INV_H,
          alive: true,
          thinking: false,
          thinkTimer: 0,
          dodgeCooldown: 0,
        });
      }
    }
    return inv;
  };

  // ─── Build boss ─────────────────────────────────────────────────────────────
  const buildBoss = () => ({
    x: VW / 2 - 80,
    y: 70,
    w: 160,
    h: 80,
    hp: 20,
    maxHp: 20,
    dir: 1,
    speed: 2,
    shootTimer: 0,
    bullets: [],
  });

  // ─── Generate starfield ─────────────────────────────────────────────────────
  const buildStars = () =>
    Array.from({ length: 80 }, () => ({
      x: Math.random() * VW,
      y: Math.random() * VH,
      r: Math.random() * 1.2 + 0.3,
      a: Math.random() * 0.7 + 0.3,
    }));

  // ─── Init / reset game ──────────────────────────────────────────────────────
  const initGame = useCallback((level, prevScore, prevLives, prevHighScore, prevShield) => {
    const highScore = prevHighScore ?? parseInt(localStorage.getItem('si-highscore') || '0', 10);
    const isBossLevel = level % 3 === 0;
    gameRef.current = {
      state: 'playing',
      score: prevScore ?? 0,
      highScore,
      lives: prevLives ?? 3,
      level,
      stars: gameRef.current?.stars ?? buildStars(),
      player: { x: VW / 2 - PLAYER_W / 2, y: VH - 70, shootCooldown: 0 },
      bullets: [],
      invaders: isBossLevel ? [] : buildInvaders(),
      boss: isBossLevel ? buildBoss() : null,
      invaderDir: 1,
      moveInterval: Math.max(10, INIT_MOVE_INTERVAL - (level - 1) * 4),
      moveCounter: 0,
      bombs: [],
      bombTimer: 0,
      bombInterval: Math.max(40, INIT_BOMB_INTERVAL - (level - 1) * 8),
      shield: prevShield ?? { active: false, timer: 0, remaining: 3 },
      frame: 0,
    };
  }, []);

  const startGame = useCallback(() => {
    gameRef.current = {
      state: 'playing',
      score: 0,
      highScore: parseInt(localStorage.getItem('si-highscore') || '0', 10),
      lives: 3,
      level: 1,
      stars: gameRef.current?.stars ?? buildStars(),
    };
    initGame(1, 0, 3, parseInt(localStorage.getItem('si-highscore') || '0', 10), { active: false, timer: 0, remaining: 3 });
  }, [initGame]);

  // ─── Update (one frame of game logic) ──────────────────────────────────────
  const update = useCallback(() => {
    const g = gameRef.current;
    if (!g || g.state !== 'playing') return;
    g.frame++;

    const keys = keysRef.current;

    // ── Player movement ────────────────────────────────────────────────────────
    if ((keys['ArrowLeft'] || keys['a'] || keys['A']) && g.player.x > 0)
      g.player.x = Math.max(0, g.player.x - PLAYER_SPEED);
    if ((keys['ArrowRight'] || keys['d'] || keys['D']) && g.player.x < VW - PLAYER_W)
      g.player.x = Math.min(VW - PLAYER_W, g.player.x + PLAYER_SPEED);

    // ── Shooting ───────────────────────────────────────────────────────────────
    g.player.shootCooldown = Math.max(0, g.player.shootCooldown - 1);
    if ((keys[' '] || keys['Space']) && g.player.shootCooldown === 0) {
      g.bullets.push({ x: g.player.x + PLAYER_W / 2, y: g.player.y });
      g.player.shootCooldown = SHOOT_COOLDOWN;
    }

    // ── Shield ─────────────────────────────────────────────────────────────────
    if ((keys['s'] || keys['S']) && !g.shield.active && g.shield.remaining > 0) {
      g.shield.active = true;
      g.shield.timer = SHIELD_DURATION;
      g.shield.remaining--;
      keysRef.current['s'] = false;
      keysRef.current['S'] = false;
    }
    if (g.shield.active) {
      g.shield.timer--;
      if (g.shield.timer <= 0) g.shield.active = false;
    }

    // ── Move player bullets ────────────────────────────────────────────────────
    g.bullets = g.bullets.filter(b => { b.y -= BULLET_SPEED; return b.y > -10; });

    // ── Bullet vs invader collision (+ dodge trigger) ──────────────────────────
    g.bullets = g.bullets.filter(bullet => {
      // Dodge check: any alive invader in this bullet's column?
      for (const inv of g.invaders) {
        if (!inv.alive || inv.thinking) continue;
        if (inv.dodgeCooldown > 0) { inv.dodgeCooldown--; continue; }
        // Bullet is below invader and within horizontal band
        if (
          bullet.x > inv.x - 4 && bullet.x < inv.x + SPRITE_W + 4 &&
          bullet.y > inv.y + SPRITE_H && bullet.y < inv.y + SPRITE_H + 80 &&
          Math.random() < 0.20
        ) {
          inv.thinking = true;
          inv.thinkTimer = 45;
        }
      }

      // Collision detection
      for (const inv of g.invaders) {
        if (!inv.alive) continue;
        if (
          bullet.x > inv.x && bullet.x < inv.x + SPRITE_W &&
          bullet.y > inv.y && bullet.y < inv.y + SPRITE_H
        ) {
          inv.alive = false;
          g.score += inv.pts;
          if (g.score > g.highScore) g.highScore = g.score;
          return false; // remove bullet
        }
      }

      // Bullet vs boss
      if (g.boss) {
        const b = g.boss;
        if (bullet.x > b.x && bullet.x < b.x + b.w && bullet.y > b.y && bullet.y < b.y + b.h) {
          b.hp--;
          g.score += 5;
          if (g.score > g.highScore) g.highScore = g.score;
          if (b.hp <= 0) {
            g.score += 500;
            if (g.score > g.highScore) g.highScore = g.score;
            g.boss = null;
          }
          return false;
        }
      }
      return true;
    });

    // ── Invader thinking / dodge ───────────────────────────────────────────────
    for (const inv of g.invaders) {
      if (!inv.alive || !inv.thinking) continue;
      inv.thinkTimer--;
      if (inv.thinkTimer <= 0) {
        inv.thinking = false;
        inv.dodgeCooldown = 180;
        const shift = (Math.random() < 0.5 ? -1 : 1) * Math.round(INV_W * 0.55);
        inv.x = Math.max(5, Math.min(VW - SPRITE_W - 5, inv.x + shift));
      }
    }

    // ── Invader grid movement ──────────────────────────────────────────────────
    g.moveCounter++;
    if (g.moveCounter >= g.moveInterval) {
      g.moveCounter = 0;

      const alive = g.invaders.filter(i => i.alive);

      // Level complete?
      if (alive.length === 0 && !g.boss) {
        const { score, lives, highScore, shield, level } = g;
        initGame(level + 1, score, lives, highScore, shield);
        return;
      }

      // Wall check
      let hitWall = false;
      for (const inv of alive) {
        if ((g.invaderDir === 1 && inv.x + SPRITE_W > VW - 20) ||
            (g.invaderDir === -1 && inv.x < 20)) {
          hitWall = true;
          break;
        }
      }

      if (hitWall) {
        g.invaderDir *= -1;
        for (const inv of g.invaders) if (inv.alive) inv.y += 18;
      } else {
        const step = g.invaderDir * 12;
        for (const inv of g.invaders) if (inv.alive) inv.x += step;
      }

      // Invaders reached the bottom?
      for (const inv of g.invaders) {
        if (inv.alive && inv.y + SPRITE_H >= g.player.y - 10) {
          g.state = 'gameover';
          localStorage.setItem('si-highscore', String(g.highScore));
          return;
        }
      }
    }

    // ── Invader bomb spawning ──────────────────────────────────────────────────
    g.bombTimer++;
    if (g.bombTimer >= g.bombInterval) {
      g.bombTimer = 0;
      const alive = g.invaders.filter(i => i.alive);
      if (alive.length > 0) {
        // Pick the lowest alive invader per column
        const byCol = {};
        for (const inv of alive) {
          if (!byCol[inv.col] || inv.row > byCol[inv.col].row) byCol[inv.col] = inv;
        }
        const shooters = Object.values(byCol);
        const s = shooters[Math.floor(Math.random() * shooters.length)];
        g.bombs.push({
          x: s.x + SPRITE_W / 2,
          y: s.y + SPRITE_H,
          char: BOMB_CHARS[Math.floor(Math.random() * BOMB_CHARS.length)],
          speed: 2 + Math.random() * 1.5 + g.level * 0.2,
        });
      }
    }

    // ── Move bombs & check player hit ─────────────────────────────────────────
    g.bombs = g.bombs.filter(bomb => {
      bomb.y += bomb.speed;
      if (bomb.y > VH + 10) return false;
      const { x: px, y: py } = g.player;
      if (bomb.x > px && bomb.x < px + PLAYER_W && bomb.y > py && bomb.y < py + PLAYER_H) {
        if (!g.shield.active) {
          g.lives--;
          if (g.lives <= 0) {
            g.state = 'gameover';
            localStorage.setItem('si-highscore', String(g.highScore));
          }
        }
        return false;
      }
      return true;
    });

    // ── Boss movement & shooting ───────────────────────────────────────────────
    if (g.boss) {
      const b = g.boss;
      b.x += b.dir * b.speed;
      if (b.x < 20 || b.x + b.w > VW - 20) b.dir *= -1;

      b.shootTimer++;
      const shootFreq = Math.max(20, 40 - g.level * 2);
      if (b.shootTimer >= shootFreq) {
        b.shootTimer = 0;
        // 3-spread shot
        for (let i = -1; i <= 1; i++) {
          b.bullets.push({ x: b.x + b.w / 2 + i * 28, y: b.y + b.h, vy: 3 + Math.abs(i) * 0.4 });
        }
      }

      b.bullets = b.bullets.filter(bb => {
        bb.y += bb.vy;
        if (bb.y > VH + 10) return false;
        const { x: px, y: py } = g.player;
        if (bb.x > px && bb.x < px + PLAYER_W && bb.y > py && bb.y < py + PLAYER_H) {
          if (!g.shield.active) {
            g.lives--;
            if (g.lives <= 0) {
              g.state = 'gameover';
              localStorage.setItem('si-highscore', String(g.highScore));
            }
          }
          return false;
        }
        return true;
      });

      // Boss level complete when boss is dead (set to null above)
    }
  }, [initGame]);

  // ─── Render ─────────────────────────────────────────────────────────────────
  const render = useCallback((ctx, canvas) => {
    const g = gameRef.current;
    const sc = scRef.current;

    // Background
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars
    const stars = g?.stars ?? [];
    for (const star of stars) {
      ctx.globalAlpha = star.a * (0.7 + 0.3 * Math.sin(Date.now() / 900 + star.x));
      ctx.fillStyle = C.star;
      ctx.beginPath();
      ctx.arc(star.x * sc, star.y * sc, star.r * sc, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (!g) return;

    // ── Start / Game Over screens ──────────────────────────────────────────────
    if (g.state === 'start' || g.state === 'gameover') {
      const cx = canvas.width / 2;
      const isOver = g.state === 'gameover';
      ctx.textAlign = 'center';

      ctx.fillStyle = isOver ? '#ef4444' : '#22d3ee';
      ctx.font = `bold ${Math.round(30 * sc)}px monospace`;
      ctx.fillText(isOver ? 'GAME OVER' : 'CLAUDE INVADERS', cx, canvas.height * 0.32);

      if (isOver) {
        ctx.fillStyle = C.hud;
        ctx.font = `${Math.round(15 * sc)}px monospace`;
        ctx.fillText(`SCORE: ${g.score}`, cx, canvas.height * 0.44);
        ctx.fillText(`HIGH SCORE: ${g.highScore}`, cx, canvas.height * 0.52);
      } else {
        ctx.fillStyle = '#a855f7';
        ctx.font = `${Math.round(12 * sc)}px monospace`;
        ctx.fillText('Defeat the Claude bots before they reach Earth!', cx, canvas.height * 0.44);
        ctx.fillStyle = C.dim;
        ctx.font = `${Math.round(10 * sc)}px monospace`;
        ctx.fillText('Twists: bots dodge · code bombs fall · boss every 3 levels · prompt shield', cx, canvas.height * 0.52);
      }

      ctx.fillStyle = C.hud;
      ctx.font = `${Math.round(11 * sc)}px monospace`;
      ctx.fillText('← → Move   SPACE Shoot   S Shield (×3)', cx, canvas.height * 0.63);

      if (Math.sin(Date.now() / 380) > 0) {
        ctx.fillStyle = '#22d3ee';
        ctx.font = `bold ${Math.round(13 * sc)}px monospace`;
        ctx.fillText('PRESS ENTER OR SPACE TO PLAY', cx, canvas.height * 0.74);
      }
      ctx.textAlign = 'left';
      return;
    }

    // ── HUD ───────────────────────────────────────────────────────────────────
    ctx.font = `bold ${Math.round(13 * sc)}px monospace`;
    ctx.fillStyle = C.hud;
    ctx.fillText(`SCORE: ${g.score}`, 16 * sc, 26 * sc);

    ctx.textAlign = 'center';
    ctx.fillText(`HI: ${g.highScore}`, canvas.width / 2, 26 * sc);
    ctx.textAlign = 'right';
    ctx.fillText(`LVL: ${g.level}`, canvas.width - 16 * sc, 26 * sc);
    ctx.textAlign = 'left';

    // Lives (triangles)
    ctx.fillStyle = C.player;
    ctx.font = `${Math.round(12 * sc)}px monospace`;
    for (let i = 0; i < g.lives; i++) {
      ctx.fillText('▲', (16 + i * 18) * sc, 44 * sc);
    }

    // Shield indicator
    ctx.fillStyle = g.shield.active ? C.shieldBorder : C.dim;
    ctx.fillText(`[S] SHIELD: ${g.shield.remaining}`, 16 * sc, 57 * sc);

    // Boss level indicator
    if (g.boss) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ef4444';
      ctx.font = `bold ${Math.round(11 * sc)}px monospace`;
      ctx.fillText(`— BOSS LEVEL ${g.level} —`, canvas.width / 2, 57 * sc);
      ctx.textAlign = 'left';
    }

    // ── Draw invaders ─────────────────────────────────────────────────────────
    for (const inv of g.invaders) {
      if (!inv.alive) continue;
      const col = C[inv.type];
      drawSprite(ctx, inv.type, inv.x, inv.y, col.body, col.accent);
      // Thinking animation
      if (inv.thinking) {
        ctx.fillStyle = C.think;
        ctx.font = `bold ${Math.round(9 * sc)}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('...', (inv.x + SPRITE_W / 2) * sc, (inv.y - 6) * sc);
        ctx.textAlign = 'left';
      }
    }

    // ── Draw boss ─────────────────────────────────────────────────────────────
    if (g.boss) drawBoss(ctx, g.boss, g.frame);

    // ── Draw bombs (falling code snippets) ────────────────────────────────────
    ctx.fillStyle = C.bomb;
    ctx.font = `bold ${Math.round(11 * sc)}px monospace`;
    for (const bomb of g.bombs) {
      ctx.fillText(bomb.char, bomb.x * sc, bomb.y * sc);
    }

    // ── Draw player bullets ───────────────────────────────────────────────────
    ctx.fillStyle = C.bullet;
    for (const b of g.bullets) {
      ctx.fillRect(b.x * sc - 2 * sc, b.y * sc, 4 * sc, 12 * sc);
    }

    // ── Draw player ───────────────────────────────────────────────────────────
    drawPlayer(ctx, g.player.x, g.player.y);

    // ── Draw prompt shield ────────────────────────────────────────────────────
    if (g.shield.active) {
      const px = g.player.x * sc;
      const py = g.player.y * sc;
      const pw = PLAYER_W * sc;
      const ph = PLAYER_H * sc;
      const pulse = 0.55 + 0.45 * Math.sin(g.frame * 0.25);
      ctx.globalAlpha = pulse;
      ctx.fillStyle = C.shield;
      ctx.strokeStyle = C.shieldBorder;
      ctx.lineWidth = 2.5 * sc;
      ctx.beginPath();
      ctx.ellipse(px + pw / 2, py + ph / 2, pw * 0.78, ph * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }, [drawSprite, drawPlayer, drawBoss]);

  // ─── Game loop ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      const w = canvas.parentElement.clientWidth;
      const h = Math.round(w * (VH / VW));
      canvas.width = w;
      canvas.height = h;
      scRef.current = w / VW;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initial start screen state
    gameRef.current = { state: 'start', score: 0, highScore: parseInt(localStorage.getItem('si-highscore') || '0', 10), stars: buildStars() };

    const onKeyDown = (e) => {
      keysRef.current[e.key] = true;
      const g = gameRef.current;
      if (e.key === ' ') e.preventDefault();
      if ((e.key === 'Enter' || e.key === ' ') && g && (g.state === 'start' || g.state === 'gameover')) {
        startGame();
      }
    };
    const onKeyUp = (e) => { keysRef.current[e.key] = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    let lastTs = 0;
    const loop = (ts) => {
      if (ts - lastTs >= 1000 / 60) {
        lastTs = ts;
        update();
        render(ctx, canvas);
      }
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [update, render, startGame]);

  return (
    <div className="w-full max-w-3xl mx-auto select-none">
      <canvas
        ref={canvasRef}
        className="w-full block rounded-lg border border-gray-800 focus:outline-none"
        style={{ imageRendering: 'pixelated' }}
        tabIndex={0}
      />
      <p className="text-xs text-gray-500 mt-2 text-center">
        ← → Move &nbsp;·&nbsp; Space Shoot &nbsp;·&nbsp; S — Prompt Shield ×3
      </p>
    </div>
  );
}
