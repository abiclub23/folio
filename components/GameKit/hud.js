// Shared HUD for the games: instrument panel, tilt dial, badges, banner and the result card.
// Each piece has a compact form for short screens (a phone held sideways, where the game may be under 300px tall).
import { FT, MPH } from './physics'
import { FONT, rrect } from './scene'

export const GOOD = '#4ade80'
export const BAD = '#f87171'

// Below this height the HUD switches to its compact pieces
export const isCompact = (H) => H < 400

// Top-left panel with speed and altitude, plus descent and a safe-zone bar while flying (descent !== null).
// Speeds are m/s and altitude meters. Returns the panel height so other pieces can sit below it.
// Compact: one slim line, e.g. "25 mph · 120 ft · ↓ 9 mph".
export function drawInstruments(ctx, { speed, altitude, descent = null, safeDescent, compact = false }) {
  const flying = descent !== null
  if (compact) {
    const parts = [
      [String(Math.round(speed * MPH)), 'mph', '#f8fafc'],
      [String(Math.round(Math.max(0, altitude) * FT)), 'ft', '#f8fafc'],
    ]
    if (flying) parts.push([`↓ ${Math.max(0, Math.round(descent * MPH))}`, 'mph', descent <= safeDescent ? GOOD : BAD])
    const big = `700 14px ${FONT}`, small = `600 10px ${FONT}`
    let w = 12
    for (const [v, u] of parts) {
      ctx.font = big
      w += ctx.measureText(v).width + 3
      ctx.font = small
      w += ctx.measureText(u).width + 12
    }
    ctx.fillStyle = 'rgba(15,17,21,0.62)'
    rrect(ctx, 10, 10, w, 26, 13)
    ctx.fill()
    ctx.textAlign = 'left'
    let x = 22
    for (const [v, u, color] of parts) {
      ctx.font = big
      ctx.fillStyle = color
      ctx.fillText(v, x, 28)
      x += ctx.measureText(v).width + 3
      ctx.font = small
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.fillText(u, x, 28)
      x += ctx.measureText(u).width + 12
    }
    return 26
  }
  const panelH = flying ? 150 : 96
  ctx.fillStyle = 'rgba(15,17,21,0.62)'
  rrect(ctx, 12, 12, 150, panelH, 10)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'
  ctx.lineWidth = 1
  ctx.stroke()
  const readout = (label, value, unit, y, color) => {
    ctx.textAlign = 'left'
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.font = `600 10px ${FONT}`
    ctx.fillText(label, 24, y)
    ctx.fillStyle = color || '#f8fafc'
    ctx.font = `700 22px ${FONT}`
    ctx.fillText(value, 24, y + 22)
    const w = ctx.measureText(value).width
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.font = `600 11px ${FONT}`
    ctx.fillText(unit, 28 + w, y + 22)
  }
  readout('SPEED', String(Math.round(speed * MPH)), 'mph', 32)
  readout('ALTITUDE', String(Math.round(Math.max(0, altitude) * FT)), 'ft', 76)
  if (flying) {
    const safe = descent <= safeDescent
    readout('DESCENT', String(Math.max(0, Math.round(descent * MPH))), 'mph', 120, safe ? GOOD : BAD)
    // Descent bar with the safe zone marked
    const bx = 90, by = 130, bw = 60, bh = 6, max = 25
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    rrect(ctx, bx, by, bw, bh, 3)
    ctx.fill()
    ctx.fillStyle = 'rgba(74,222,128,0.35)'
    rrect(ctx, bx, by, (bw * safeDescent) / max, bh, 3)
    ctx.fill()
    ctx.fillStyle = safe ? GOOD : BAD
    rrect(ctx, bx, by, Math.max(2, (bw * Math.min(max, Math.max(0, descent))) / max), bh, 3)
    ctx.fill()
  }
  return panelH
}

// Top-right attitude dial: the bar shows tilt, green arcs mark the safe range. top moves it down.
export function drawAttitude(ctx, W, tilt, safeTilt, top = 0, compact = false) {
  const r = compact ? 17 : 30
  const cx = W - r - 16, cy = (compact ? 31 : 50) + top
  const level = Math.abs(tilt) <= safeTilt
  ctx.fillStyle = 'rgba(15,17,21,0.62)'
  ctx.beginPath()
  ctx.arc(cx, cy, r + 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.strokeStyle = 'rgba(74,222,128,0.6)'
  ctx.lineWidth = 4
  for (const base of [0, Math.PI]) {
    ctx.beginPath()
    ctx.arc(cx, cy, r, base - safeTilt, base + safeTilt)
    ctx.stroke()
  }
  ctx.strokeStyle = level ? GOOD : BAD
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(cx - Math.cos(tilt) * (r - 6), cy + Math.sin(tilt) * (r - 6))
  ctx.lineTo(cx + Math.cos(tilt) * (r - 6), cy - Math.sin(tilt) * (r - 6))
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx - Math.sin(tilt) * r * 0.4, cy - Math.cos(tilt) * r * 0.4)
  ctx.stroke()
  ctx.textAlign = 'center'
  ctx.fillStyle = level ? GOOD : BAD
  ctx.font = `700 ${compact ? 10 : 12}px ${FONT}`
  const deg = `${Math.round((Math.abs(tilt) * 180) / Math.PI)}°`
  // Compact: the angle goes to the left of the dial rather than under it
  if (compact) {
    ctx.textAlign = 'right'
    ctx.fillText(deg, cx - r - 12, cy + 4)
  } else ctx.fillText(deg, cx, cy + r + 22)
}

// Bottom-center pill pointing at the ground when it's off screen
export function drawGroundArrow(ctx, W, H, altitude) {
  ctx.fillStyle = 'rgba(15,17,21,0.62)'
  rrect(ctx, W / 2 - 70, H - 36, 140, 26, 13)
  ctx.fill()
  ctx.textAlign = 'center'
  ctx.fillStyle = '#f8fafc'
  ctx.font = `600 12px ${FONT}`
  ctx.fillText(`▼ ground ${Math.round(altitude * FT)} ft`, W / 2, H - 18)
}

// Rounded badge under the panel, e.g. the 0–60 time
export function drawBadge(ctx, y, text, color = 'rgba(200,16,46,0.85)', compact = false) {
  const x = compact ? 10 : 12, w = compact ? 118 : 150, h = compact ? 20 : 26
  ctx.fillStyle = color
  rrect(ctx, x, y, w, h, h / 2)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.font = `700 ${compact ? 10 : 12}px ${FONT}`
  ctx.fillText(text, x + w / 2, y + h / 2 + (compact ? 3.5 : 4))
}

// Big centered banner that fades in and out over a few seconds; toast = { title, line, at }
export function drawToast(ctx, W, H, toast, t) {
  if (!toast || t - toast.at >= 4.5) return
  const age = t - toast.at
  const a = Math.min(1, age * 3, (4.5 - age) * 2)
  ctx.globalAlpha = a
  ctx.textAlign = 'center'
  const small = W < 520 || isCompact(H)
  ctx.fillStyle = '#f8fafc'
  ctx.font = `800 ${small ? 26 : 40}px ${FONT}`
  ctx.fillText(toast.title, W / 2, H * 0.3)
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  ctx.font = `600 ${small ? 13 : 17}px ${FONT}`
  ctx.fillText(toast.line, W / 2, H * 0.3 + (small ? 22 : 30))
  ctx.globalAlpha = 1
}

// Centered result card: msg = { title, line, detail?, color }. again adds the "go again" hint.
// minTop keeps it below the instrument panel; insets keeps it between thumb buttons over the bottom corners.
export function drawCard(ctx, W, H, msg, { again = false, touch = false, minTop = 0, insets = null } = {}) {
  if (isCompact(H)) return drawSlimCard(ctx, W, H, msg, { again, touch, minTop, insets })
  const small = W < 420
  const side = insets ? Math.max(12, insets.left, insets.right) : 12
  const boxW = Math.min(W - 2 * side, 620)
  const boxH = (small ? 96 : 112) + (msg.detail ? 22 : 0) + (again ? 26 : 0)
  const top = Math.max(H / 2 - boxH / 2, minTop)
  ctx.fillStyle = 'rgba(15,17,21,0.82)'
  rrect(ctx, (W - boxW) / 2, top, boxW, boxH, 14)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.textAlign = 'center'
  ctx.fillStyle = msg.color
  // Shrink the big lines to fit narrow screens
  const fit = (text, weight, size, maxW) => {
    let s = size
    ctx.font = `${weight} ${s}px ${FONT}`
    while (s > 12 && ctx.measureText(text).width > maxW) ctx.font = `${weight} ${--s}px ${FONT}`
  }
  fit(msg.title, 800, small ? 28 : 36, boxW - 28)
  ctx.fillText(msg.title, W / 2, top + (small ? 40 : 48))
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  fit(msg.line, 600, small ? 17 : 20, boxW - 28)
  let y = top + (small ? 72 : 86)
  ctx.fillText(msg.line, W / 2, y)
  if (msg.detail) {
    y += 24
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.font = `500 ${small ? 12 : 14}px ${FONT}`
    ctx.fillText(msg.detail, W / 2, y)
  }
  if (again) {
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = `600 13px ${FONT}`
    ctx.fillText(touch ? 'Tap Thrust to go again' : 'Press ↑ or W to go again', W / 2, y + 28)
  }
}

// The result card for short screens: a slim banner between the thumb buttons, sized to its text,
// sitting just under the top readouts so most of the scene stays visible
function drawSlimCard(ctx, W, H, msg, { again, touch, minTop, insets }) {
  const side = insets ? Math.max(12, insets.left, insets.right) : 12
  const maxW = Math.min(W - 2 * side, 460)
  const lines = [[msg.line, `600 13px ${FONT}`, 'rgba(255,255,255,0.9)']]
  if (msg.detail) lines.push([msg.detail, `500 11px ${FONT}`, 'rgba(255,255,255,0.6)'])
  if (again) lines.push([touch ? 'Tap Thrust to go again' : 'Press ↑ or W to go again', `600 11px ${FONT}`, 'rgba(255,255,255,0.5)'])
  const fit = (text, font, w) => {
    ctx.font = font
    let size = parseInt(font.match(/(\d+)px/)[1], 10)
    while (size > 9 && ctx.measureText(text).width > w) ctx.font = font.replace(/\d+px/, `${--size}px`)
    return ctx.font
  }
  let w = 0
  ctx.font = `800 22px ${FONT}`
  w = Math.max(w, ctx.measureText(msg.title).width)
  for (const [text, font] of lines) {
    ctx.font = font
    w = Math.max(w, ctx.measureText(text).width)
  }
  const boxW = Math.min(maxW, w + 32)
  const boxH = 36 + lines.length * 16 + 8
  const top = Math.max(minTop, Math.min(H * 0.3, H - (insets ? insets.bottom : 12) - boxH - 8))
  ctx.fillStyle = 'rgba(15,17,21,0.82)'
  rrect(ctx, (W - boxW) / 2, top, boxW, boxH, 10)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.textAlign = 'center'
  ctx.fillStyle = msg.color
  ctx.font = fit(msg.title, `800 22px ${FONT}`, boxW - 20)
  ctx.fillText(msg.title, W / 2, top + 28)
  let y = top + 36
  for (const [text, font, color] of lines) {
    y += 16
    ctx.fillStyle = color
    ctx.font = fit(text, font, boxW - 20)
    ctx.fillText(text, W / 2, y - 3)
  }
}
