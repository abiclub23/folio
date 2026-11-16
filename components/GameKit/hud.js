// Shared HUD for the games: instrument panel, tilt dial, badges, banner and the result card
import { FT, MPH } from './physics'
import { FONT, rrect } from './scene'

export const GOOD = '#4ade80'
export const BAD = '#f87171'

// Top-left panel with speed and altitude, plus descent and a safe-zone bar while flying (descent !== null).
// Speeds are m/s and altitude meters. Returns the panel height so other pieces can sit below it.
export function drawInstruments(ctx, { speed, altitude, descent = null, safeDescent }) {
  const flying = descent !== null
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

// Top-right attitude dial: the bar shows tilt, green arcs mark the safe range
export function drawAttitude(ctx, W, tilt, safeTilt) {
  const cx = W - 46, cy = 50, r = 30
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
  ctx.lineTo(cx - Math.sin(tilt) * 12, cy - Math.cos(tilt) * 12)
  ctx.stroke()
  ctx.textAlign = 'center'
  ctx.fillStyle = level ? GOOD : BAD
  ctx.font = `700 12px ${FONT}`
  ctx.fillText(`${Math.round((Math.abs(tilt) * 180) / Math.PI)}°`, cx, cy + r + 22)
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
export function drawBadge(ctx, y, text, color = 'rgba(200,16,46,0.85)') {
  ctx.fillStyle = color
  rrect(ctx, 12, y, 150, 26, 13)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.font = `700 12px ${FONT}`
  ctx.fillText(text, 87, y + 17)
}

// Big centered banner that fades in and out over a few seconds; toast = { title, line, at }
export function drawToast(ctx, W, H, toast, t) {
  if (!toast || t - toast.at >= 4.5) return
  const age = t - toast.at
  const a = Math.min(1, age * 3, (4.5 - age) * 2)
  ctx.globalAlpha = a
  ctx.textAlign = 'center'
  ctx.fillStyle = '#f8fafc'
  ctx.font = `800 ${W < 520 ? 30 : 40}px ${FONT}`
  ctx.fillText(toast.title, W / 2, H * 0.3)
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  ctx.font = `600 ${W < 520 ? 14 : 17}px ${FONT}`
  ctx.fillText(toast.line, W / 2, H * 0.3 + 30)
  ctx.globalAlpha = 1
}

// Centered result card: msg = { title, line, detail?, color }. again adds the "go again" hint.
// minTop keeps it below the instrument panel.
export function drawCard(ctx, W, H, msg, { again = false, touch = false, minTop = 0 } = {}) {
  const small = W < 420
  const boxW = Math.min(W - 24, 620)
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
