// Synthesized with Web Audio, so there are no files to load. Starts on the first key press or tap.
export const Sound = {
  ctx: null,
  nodes: null,
  muted: false,
  lastPhase: null,
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
  // Called every frame: continuous sounds follow the game, one-shots fire on phase changes
  update(game, input, slow) {
    if (!this.nodes) return
    const n = this.nodes
    const car = game.car
    const onTrack = game.phase === 'runway' || game.phase === 'ramp'
    const sp = onTrack ? Math.abs(game.speed) : 0
    this.ramp(n.motor.frequency, 35 + sp * 4)
    this.ramp(n.whine.frequency, 220 + sp * 32)
    this.ramp(n.motorG.gain, onTrack ? (input.thrust ? 0.1 : 0.03) : 0)
    this.ramp(n.whineG.gain, onTrack ? (input.thrust ? 0.045 : 0.012) : 0)
    const flying = game.phase === 'flight'
    this.ramp(n.thrG.gain, flying && input.thrust ? 0.55 : 0)
    const v = flying ? Math.hypot(car.vx, car.vy) : 0
    this.ramp(n.windG.gain, Math.min(0.3, v / 100) * (slow ? 0.4 : 1))
    this.ramp(n.windF.frequency, 250 + v * 12)

    if (game.phase !== this.lastPhase) {
      if (game.phase === 'crashed') this.boing()
      if (game.phase === 'rolling') this.thud()
      if (game.phase === 'landed') this.chime()
      this.lastPhase = game.phase
    }
    if (game.starman && !this.playedStarman) this.fanfare()
    this.playedStarman = !!game.starman
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
