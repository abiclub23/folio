// Shared game sound, synthesized with Web Audio so there are no files to load. Starts on the first key press or tap.
// Each game sets the continuous levels every frame with mix() and fires one-shots (boing, thud, chime, ...) on events.
export const Sound = {
  ctx: null,
  nodes: null,
  muted: false,
  lastPhase: null,
  flags: {},
  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume()
      return
    }
    const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)
    if (!AC) return
    const ctx = (this.ctx = new AC())
    const master = ctx.createGain()
    master.gain.value = this.muted ? 0 : 0.5
    master.connect(ctx.destination)

    // Electric motor: a low saw for body plus a sine whine that climbs with speed
    const motor = ctx.createOscillator()
    motor.type = 'sawtooth'
    const motorF = ctx.createBiquadFilter()
    motorF.type = 'lowpass'
    motorF.frequency.value = 900
    const motorG = ctx.createGain()
    motorG.gain.value = 0
    motor.connect(motorF).connect(motorG).connect(master)
    motor.start()
    const whine = ctx.createOscillator()
    const whineG = ctx.createGain()
    whineG.gain.value = 0
    whine.connect(whineG).connect(master)
    whine.start()

    // Looping noise feeds the thrusters (band-passed) and wind (low-passed)
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    this.noiseBuf = buf
    const noise = ctx.createBufferSource()
    noise.buffer = buf
    noise.loop = true
    const thrF = ctx.createBiquadFilter()
    thrF.type = 'bandpass'
    thrF.frequency.value = 500
    thrF.Q.value = 0.5
    const thrG = ctx.createGain()
    thrG.gain.value = 0
    const windF = ctx.createBiquadFilter()
    windF.type = 'lowpass'
    windF.frequency.value = 300
    const windG = ctx.createGain()
    windG.gain.value = 0
    noise.connect(thrF).connect(thrG).connect(master)
    noise.connect(windF).connect(windG).connect(master)
    noise.start()
    this.nodes = { master, motor, motorG, whine, whineG, thrG, windF, windG }
  },
  ramp(param, value) {
    param.setTargetAtTime(value, this.ctx.currentTime, 0.06)
  },
  setMuted(muted) {
    this.muted = muted
    if (this.nodes) this.ramp(this.nodes.master.gain, muted ? 0 : 0.5)
  },
  // Continuous sounds, set every frame. Each is [gain, frequency] except thrust, which is a gain.
  mix({ motor = [0, 35], whine = [0, 220], thrust = 0, wind = [0, 250] }) {
    if (!this.nodes) return
    const n = this.nodes
    this.ramp(n.motor.frequency, motor[1])
    this.ramp(n.whine.frequency, whine[1])
    this.ramp(n.motorG.gain, motor[0])
    this.ramp(n.whineG.gain, whine[0])
    this.ramp(n.thrG.gain, thrust)
    this.ramp(n.windG.gain, wind[0])
    this.ramp(n.windF.frequency, wind[1])
  },
  // True once each time the phase changes, for one-shot sounds
  phaseChanged(phase) {
    if (!this.nodes || phase === this.lastPhase) return false
    this.lastPhase = phase
    return true
  },
  // True the first frame a condition turns on; resets when it turns off
  once(key, on) {
    const fire = !!this.nodes && !!on && !this.flags[key]
    this.flags[key] = !!on
    return fire
  },
  // Stop audio when the page unmounts
  dispose() {
    if (this.ctx) this.ctx.close()
    this.ctx = this.nodes = this.lastPhase = null
    this.flags = {}
  },
  // Cartoon crash: a wobbling pitch drop over a low thump
  boing() {
    const c = this.ctx, t = c.currentTime, out = this.nodes.master
    const o = c.createOscillator()
    o.type = 'triangle'
    o.frequency.setValueAtTime(560, t)
    o.frequency.exponentialRampToValueAtTime(80, t + 0.7)
    const lfo = c.createOscillator()
    lfo.frequency.value = 16
    const depth = c.createGain()
    depth.gain.value = 45
    lfo.connect(depth).connect(o.frequency)
    const g = c.createGain()
    g.gain.setValueAtTime(0.45, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.8)
    o.connect(g).connect(out)
    o.start(t)
    lfo.start(t)
    o.stop(t + 0.85)
    lfo.stop(t + 0.85)
    this.thud(0.9)
  },
  thud(level = 0.5) {
    const c = this.ctx, t = c.currentTime
    const src = c.createBufferSource()
    src.buffer = this.noiseBuf
    const f = c.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = 250
    const g = c.createGain()
    g.gain.setValueAtTime(level, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
    src.connect(f).connect(g).connect(this.nodes.master)
    src.start(t)
    src.stop(t + 0.4)
  },
  // Rising synth arpeggio for reaching space
  fanfare() {
    const c = this.ctx, t = c.currentTime
    ;[392, 523, 659, 784, 1047].forEach((freq, i) => {
      const o = c.createOscillator()
      o.type = 'square'
      o.frequency.value = freq
      const f = c.createBiquadFilter()
      f.type = 'lowpass'
      f.frequency.value = 2200
      const g = c.createGain()
      const at = t + i * 0.14
      g.gain.setValueAtTime(0, at)
      g.gain.linearRampToValueAtTime(0.08, at + 0.02)
      g.gain.exponentialRampToValueAtTime(0.001, at + (i === 4 ? 1.2 : 0.4))
      o.connect(f).connect(g).connect(this.nodes.master)
      o.start(at)
      o.stop(at + 1.3)
    })
  },
  // Metallic clang: a few inharmonic partials that ring and fade
  clang() {
    const c = this.ctx, t = c.currentTime
    ;[220, 587, 1043, 1690].forEach((freq, i) => {
      const o = c.createOscillator()
      o.type = i ? 'sine' : 'triangle'
      o.frequency.value = freq
      const g = c.createGain()
      g.gain.setValueAtTime(0.22 / (i + 1), t)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.9 - i * 0.15)
      o.connect(g).connect(this.nodes.master)
      o.start(t)
      o.stop(t + 1)
    })
    this.thud(0.6)
  },
  // Crowd applause: band-passed noise with lots of quick random claps, swelling then fading over ~2.5s
  applause() {
    const c = this.ctx, t = c.currentTime
    const src = c.createBufferSource()
    src.buffer = this.noiseBuf
    src.loop = true
    const f = c.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.value = 1800
    f.Q.value = 0.6
    const g = c.createGain()
    g.gain.setValueAtTime(0, t)
    for (let i = 0; i < 90; i++) {
      const at = t + i * 0.028
      const swell = Math.sin((Math.PI * i) / 90)
      g.gain.setValueAtTime(swell * (0.12 + Math.random() * 0.22), at)
    }
    g.gain.exponentialRampToValueAtTime(0.001, t + 2.6)
    src.connect(f).connect(g).connect(this.nodes.master)
    src.start(t)
    src.stop(t + 2.7)
  },
  chime() {
    const c = this.ctx, t = c.currentTime
    ;[660, 880, 1320].forEach((freq, i) => {
      const o = c.createOscillator()
      o.frequency.value = freq
      const g = c.createGain()
      g.gain.setValueAtTime(0, t + i * 0.1)
      g.gain.linearRampToValueAtTime(0.18, t + i * 0.1 + 0.02)
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.5)
      o.connect(g).connect(this.nodes.master)
      o.start(t + i * 0.1)
      o.stop(t + i * 0.1 + 0.55)
    })
  },
}
