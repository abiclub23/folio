// Starship Catch in 3D: the same rules (physics.js) and broadcast overlay (draw.js's HUD), drawn as a three.js scene.
// The game still plays in a flat plane (x across, y up, z = 0); the world around it is fully 3D, with a
// physically based sky, sunlight and shadows, a lattice tower whose arms swing shut, and a drone-style camera.
// Each frame is rendered by WebGL into a hidden canvas and copied into the game's 2D canvas, so the shared page
// shell and the 2D HUD work unchanged.
import * as THREE from 'three'
import { Sky } from 'three/examples/jsm/objects/Sky.js'
import {
  ARM_LEN, ARM_Y, CATCH_X, MOUNT, OCEAN_X, PIN_Y, SHIP_H, SHIP_W, TOWER_H, TOWER_W, TOWER_X, pinPoint, slowMo,
} from './physics'
import { drawHud, drawTargetMarker, filmFinish } from './draw'

export { drawHud }

// Low morning sun over the Gulf (to the left), slightly toward the camera so the ship's front is lit
const SUN_ELEVATION = THREE.MathUtils.degToRad(9)
const SUN_AZIMUTH = THREE.MathUtils.degToRad(-62) // from +z toward -x
const SUN_DIR = new THREE.Vector3(
  Math.cos(SUN_ELEVATION) * Math.sin(SUN_AZIMUTH),
  Math.sin(SUN_ELEVATION),
  Math.cos(SUN_ELEVATION) * Math.cos(SUN_AZIMUTH),
).normalize()
const ARM_Z = SHIP_W / 2 + 1.4 // arms sit either side of the ship
const ARM_OPEN = THREE.MathUtils.degToRad(32)
const FOV = 40

let world = null

function steel(color = '#d2d4d8', rough = 0.32) {
  return new THREE.MeshStandardMaterial({ color, metalness: 0.9, roughness: rough })
}

// Soft round sprite for particles and clouds
function softTexture(size = 64, noisy = false) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')
  const r = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  r.addColorStop(0, 'rgba(255,255,255,1)')
  r.addColorStop(0.5, 'rgba(255,255,255,0.5)')
  r.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = r
  g.fillRect(0, 0, size, size)
  if (noisy) {
    for (let i = 0; i < 40; i++) {
      const x = size * (0.2 + Math.random() * 0.6), y = size * (0.3 + Math.random() * 0.4), rr = size * (0.08 + Math.random() * 0.14)
      const q = g.createRadialGradient(x, y, 0, x, y, rr)
      q.addColorStop(0, 'rgba(255,255,255,0.35)')
      q.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = q
      g.fillRect(0, 0, size, size)
    }
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

// Speckled texture so the sand and concrete aren't flat
function groundTexture(base, speck) {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  g.fillStyle = base
  g.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = speck[i % speck.length]
    g.globalAlpha = 0.08 + Math.random() * 0.12
    g.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 3, 1 + Math.random() * 2)
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

// Ripple normal map for the sea
function waterNormals() {
  const size = 128
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      const a = Math.sin((x / size) * Math.PI * 6) * 0.5 + Math.sin(((x + y * 2) / size) * Math.PI * 8) * 0.3 + Math.sin((y / size) * Math.PI * 10) * 0.2
      const b = Math.cos((y / size) * Math.PI * 6) * 0.5 + Math.cos(((y - x) / size) * Math.PI * 8) * 0.3
      data[i] = 128 + a * 50
      data[i + 1] = 128 + b * 50
      data[i + 2] = 255
      data[i + 3] = 255
    }
  }
  const t = new THREE.DataTexture(data, size, size)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.needsUpdate = true
  return t
}

// Lattice tower: four corner columns, a ring of beams every 6 m and X-bracing on each face
function buildTower() {
  const tower = new THREE.Group()
  const mat = steel('#5c6168', 0.55)
  const cx = TOWER_X + TOWER_W / 2, half = TOWER_W / 2
  const col = new THREE.BoxGeometry(0.9, TOWER_H, 0.9)
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const m = new THREE.Mesh(col, mat)
    m.position.set(cx + dx * (half - 0.45), TOWER_H / 2, dz * (half - 0.45))
    m.castShadow = true
    tower.add(m)
  }
  // Beams and braces as instances of one thin box
  const beam = new THREE.BoxGeometry(1, 0.35, 0.35)
  const levels = Math.floor(TOWER_H / 6)
  const count = levels * 4 * 3
  const inst = new THREE.InstancedMesh(beam, mat, count)
  inst.castShadow = true
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pos = new THREE.Vector3()
  let n = 0
  const put = (x0, y0, z0, x1, y1, z1) => {
    const a = new THREE.Vector3(x0, y0, z0), b = new THREE.Vector3(x1, y1, z1)
    const len = a.distanceTo(b)
    pos.copy(a).add(b).multiplyScalar(0.5)
    q.setFromUnitVectors(new THREE.Vector3(1, 0, 0), b.clone().sub(a).normalize())
    sc.set(len, 1, 1)
    m.compose(pos, q, sc)
    inst.setMatrixAt(n++, m)
  }
  const x0 = cx - half, x1 = cx + half
  for (let i = 0; i < levels; i++) {
    const y = i * 6, y2 = y + 6
    // Ring
    put(x0, y2, -half, x1, y2, -half)
    put(x0, y2, half, x1, y2, half)
    put(x0, y2, -half, x0, y2, half)
    put(x1, y2, -half, x1, y2, half)
    // One diagonal per face, alternating direction up the tower
    const flip = i % 2 ? 1 : -1
    put(x0, y, flip * half, x1, y2, -flip * half)
    put(x0, y, -half * flip, x0, y2, half * flip)
    put(x1, y, half * flip, x1, y2, -half * flip)
    put(x0, y, half, x1, y2, half)
  }
  inst.count = n
  tower.add(inst)
  // Roof, lightning rod and crane
  const roof = new THREE.Mesh(new THREE.BoxGeometry(TOWER_W + 2, 2, TOWER_W + 2), mat)
  roof.position.set(cx, TOWER_H + 1, 0)
  roof.castShadow = true
  tower.add(roof)
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 14), mat)
  rod.position.set(cx, TOWER_H + 9, 0)
  tower.add(rod)
  const boom = new THREE.Mesh(new THREE.BoxGeometry(18, 0.6, 0.6), mat)
  boom.position.set(cx + 9, TOWER_H + 5, 0)
  boom.rotation.z = 0.35
  tower.add(boom)
  // Carriage that carries the arms
  const carriage = new THREE.Mesh(new THREE.BoxGeometry(TOWER_W + 3, 12, TOWER_W + 3), steel('#4d5258', 0.5))
  carriage.position.set(cx, ARM_Y + 2, 0)
  carriage.castShadow = true
  tower.add(carriage)
  // Red aircraft lights on the corners
  const lights = new THREE.Group()
  const lmat = new THREE.MeshBasicMaterial({ color: '#ff3b3b' })
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), lmat)
    l.position.set(cx + dx * half, TOWER_H + 2.3, dz * half)
    lights.add(l)
  }
  tower.add(lights)
  return { tower, lights }
}

// One chopstick: a truss arm that pivots at the tower and reaches out toward -x
function buildArm(side) {
  const pivot = new THREE.Group()
  pivot.position.set(TOWER_X, ARM_Y, side * ARM_Z)
  const mat = steel('#b9bdc3', 0.45)
  const chord = new THREE.BoxGeometry(ARM_LEN, 0.6, 0.6)
  for (const [y, z] of [[0, 0], [-3.4, 0], [0, side * 1.6], [-3.4, side * 1.6]]) {
    const c = new THREE.Mesh(chord, mat)
    c.position.set(-ARM_LEN / 2, y, z)
    c.castShadow = true
    pivot.add(c)
  }
  const web = new THREE.BoxGeometry(0.25, 4.2, 0.25)
  for (let x = -ARM_LEN + 1; x < -0.5; x += 2.4) {
    const w = new THREE.Mesh(web, mat)
    w.position.set(x, -1.7, side * 0.8)
    w.rotation.z = 0.6
    pivot.add(w)
  }
  // Catch rail: lights green when lined up
  const rail = new THREE.Mesh(new THREE.BoxGeometry(8, 0.4, 1.8), new THREE.MeshStandardMaterial({ color: '#30343a', emissive: '#000000' }))
  rail.position.set(CATCH_X - TOWER_X, 0.5, side * 0.8)
  pivot.add(rail)
  return { pivot, rail }
}

// Starship: steel barrel and ogive nose, black heat shield on its belly half, flaps, engines and catch pins.
// The group's origin is the center of the engines, like the game's.
function buildShip() {
  const ship = new THREE.Group()
  const r = SHIP_W / 2, noseStart = SHIP_H - 15
  const profile = [new THREE.Vector2(0.01, 0.2), new THREE.Vector2(r, 0.2), new THREE.Vector2(r, noseStart)]
  for (let i = 1; i <= 14; i++) {
    const k = i / 14
    profile.push(new THREE.Vector2(r * Math.cos(k * Math.PI / 2) ** 0.8 + 0.01, noseStart + k * 15))
  }
  // Brushed stainless: bright, only partly mirror-like so it reads silver rather than dark
  const body = new THREE.Mesh(new THREE.LatheGeometry(profile, 48), new THREE.MeshStandardMaterial({ color: '#e4e5e8', metalness: 0.55, roughness: 0.3 }))
  body.castShadow = true
  ship.add(body)
  const shieldProfile = profile.map((p) => new THREE.Vector2(p.x + 0.04, p.y))
  // The tiles cover the belly half, turned partly away from the camera so the steel side shows too
  const shield = new THREE.Mesh(
    new THREE.LatheGeometry(shieldProfile, 24, Math.PI / 4, Math.PI),
    new THREE.MeshStandardMaterial({ color: '#17181b', roughness: 0.85, metalness: 0.1 }),
  )
  shield.castShadow = true
  ship.add(shield)
  // Flaps on both sides (±z), small forward pair and bigger aft pair
  const flapMat = new THREE.MeshStandardMaterial({ color: '#1b1c1f', roughness: 0.8 })
  const flaps = []
  for (const [y, h, w] of [[noseStart + 4, 7, 2.6], [6, 9, 3.4]]) {
    for (const side of [-1, 1]) {
      const pivot = new THREE.Group()
      pivot.position.set(0, y, side * r)
      const f = new THREE.Mesh(new THREE.BoxGeometry(0.4, h, w), flapMat)
      f.position.set(0, 0, side * w / 2)
      f.castShadow = true
      pivot.add(f)
      ship.add(pivot)
      flaps.push({ pivot, side })
    }
  }
  // Catch pins
  const pinMat = steel('#45484d', 0.5)
  for (const side of [-1, 1]) {
    const pin = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1, 1.4), pinMat)
    pin.position.set(0, PIN_Y, side * (r + 0.6))
    ship.add(pin)
  }
  // Three sea-level engines and their plumes
  const bellMat = new THREE.MeshStandardMaterial({ color: '#2a2c30', metalness: 0.6, roughness: 0.5 })
  const plumeMat = new THREE.MeshBasicMaterial({ color: '#ffd8b0', transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })
  const plumes = []
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2
    const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.95, 1.8, 16, 1, true), bellMat)
    bell.position.set(Math.cos(a) * 1.8, -0.7, Math.sin(a) * 1.8)
    ship.add(bell)
    const plume = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 16, 1, true), plumeMat)
    plume.rotation.x = Math.PI
    plume.position.set(bell.position.x, -1.6, bell.position.z)
    ship.add(plume)
    plumes.push(plume)
  }
  // Steering jets near the nose
  const jetMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })
  const jets = [-1, 1].map((side) => {
    const j = new THREE.Mesh(new THREE.ConeGeometry(0.6, 5, 10, 1, true), jetMat)
    j.rotation.z = side * Math.PI / 2
    j.position.set(side * (r + 2.6), SHIP_H - 10, 0)
    ship.add(j)
    return { mesh: j, side }
  })
  return { ship, flaps, plumes, jets }
}

// People: small capsules, orange hi-vis for the crew, everyday colors for spectators
function buildPeople(crew) {
  const g = new THREE.Group()
  const geo = new THREE.CapsuleGeometry(0.28, 1.1, 4, 8)
  const head = new THREE.SphereGeometry(0.22, 8, 8)
  const shirts = ['#3d5a80', '#7a4b3a', '#5b6b4a', '#a8a29a', '#2f3b52']
  const meshes = crew.map((c, i) => {
    const p = new THREE.Group()
    const body = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: c.role === 'crew' ? '#ff8a1f' : shirts[i % 5], roughness: 0.8 }))
    body.position.y = 0.85
    body.castShadow = true
    const h = new THREE.Mesh(head, new THREE.MeshStandardMaterial({ color: c.role === 'crew' ? '#f4f4f0' : '#5a4136', roughness: 0.7 }))
    h.position.y = 1.75
    p.add(body, h)
    g.add(p)
    return { group: p, z: c.role === 'crew' ? 10 + (i % 3) * 1.5 : 22 + (i % 2) * 2 }
  })
  return { group: g, meshes }
}

function setup(W, H, game) {
  const canvas = document.createElement('canvas')
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.75
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(FOV, W / H, 0.5, 30000)
  const pipCamera = new THREE.PerspectiveCamera(32, 5 / 3, 0.5, 30000)

  // Sky: Preetham daylight model with a low sun
  const sky = new Sky()
  sky.scale.setScalar(20000)
  const u = sky.material.uniforms
  u.turbidity.value = 4.5
  u.rayleigh.value = 1.6
  u.mieCoefficient.value = 0.005
  u.mieDirectionalG.value = 0.82
  u.sunPosition.value.copy(SUN_DIR)
  scene.add(sky)
  // Use the sky as the environment so steel reflects it
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envScene = new THREE.Scene()
  const envSky = new Sky()
  envSky.scale.setScalar(20000)
  envSky.material.uniforms.turbidity.value = u.turbidity.value
  envSky.material.uniforms.rayleigh.value = u.rayleigh.value
  envSky.material.uniforms.mieCoefficient.value = u.mieCoefficient.value
  envSky.material.uniforms.mieDirectionalG.value = u.mieDirectionalG.value
  envSky.material.uniforms.sunPosition.value.copy(SUN_DIR)
  envScene.add(envSky)
  scene.environment = pmrem.fromScene(envScene).texture
  scene.fog = new THREE.Fog('#c8ccd0', 900, 7000)

  // Light
  const sun = new THREE.DirectionalLight('#ffe2c4', 3.2)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  const sc = sun.shadow.camera
  sc.left = -140; sc.right = 140; sc.top = 200; sc.bottom = -60; sc.near = 10; sc.far = 1200
  sun.shadow.bias = -0.0005
  scene.add(sun, sun.target)
  scene.add(new THREE.HemisphereLight('#a9c4e6', '#8a7458', 0.7))

  // Ground: sand, a concrete pad around the tower, and the Gulf on the left
  const sand = new THREE.Mesh(
    new THREE.PlaneGeometry(14000, 14000),
    new THREE.MeshStandardMaterial({ map: groundTexture('#b39d7a', ['#7c6a52', '#d2c3a6', '#6b6a4a']), roughness: 1 }),
  )
  sand.material.map.repeat.set(400, 400)
  sand.rotation.x = -Math.PI / 2
  sand.receiveShadow = true
  scene.add(sand)
  const pad = new THREE.Mesh(
    new THREE.PlaneGeometry(160, 120),
    new THREE.MeshStandardMaterial({ map: groundTexture('#a9a59c', ['#8f8b83', '#c2beb6']), roughness: 0.95 }),
  )
  pad.material.map.repeat.set(8, 6)
  pad.rotation.x = -Math.PI / 2
  pad.position.set(-10, 0.05, -10)
  pad.receiveShadow = true
  scene.add(pad)
  const normals = waterNormals()
  normals.repeat.set(120, 120)
  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(9000, 14000),
    new THREE.MeshStandardMaterial({ color: '#2e5368', roughness: 0.12, metalness: 0.2, normalMap: normals, normalScale: new THREE.Vector2(0.35, 0.35) }),
  )
  sea.rotation.x = -Math.PI / 2
  sea.position.set(OCEAN_X - 4500, 0.12, 0)
  scene.add(sea)
  const beach = new THREE.Mesh(new THREE.PlaneGeometry(30, 14000), new THREE.MeshStandardMaterial({ color: '#d6c39d', roughness: 1 }))
  beach.rotation.x = -Math.PI / 2
  beach.position.set(OCEAN_X + 15, 0.08, 0)
  scene.add(beach)

  // Launch mount under the catch point
  const mountMat = new THREE.MeshStandardMaterial({ color: '#7d8187', roughness: 0.7, metalness: 0.3 })
  const table = new THREE.Mesh(new THREE.BoxGeometry(MOUNT.x1 - MOUNT.x0, 3, 20), mountMat)
  table.position.set((MOUNT.x0 + MOUNT.x1) / 2, MOUNT.top - 1.5, 0)
  table.castShadow = table.receiveShadow = true
  scene.add(table)
  for (const dx of [MOUNT.x0 + 2, MOUNT.x1 - 2]) {
    for (const dz of [-8, 8]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(2.4, MOUNT.top - 3, 2.4), mountMat)
      leg.position.set(dx, (MOUNT.top - 3) / 2, dz)
      leg.castShadow = true
      scene.add(leg)
    }
  }

  // The rest of Starbase in the distance: the other tower, tank farm and high bays
  const far = new THREE.MeshStandardMaterial({ color: '#8d9298', roughness: 0.6, metalness: 0.3 })
  const add = (geo, x, y, z) => {
    const m = new THREE.Mesh(geo, far)
    m.position.set(x, y, z)
    m.castShadow = true
    scene.add(m)
  }
  add(new THREE.BoxGeometry(12, 146, 12), 420, 73, -950)
  for (let i = 0; i < 6; i++) add(new THREE.CylinderGeometry(4, 4, 30 + (i % 3) * 8, 16), 500 + i * 11, 18, -880)
  add(new THREE.SphereGeometry(9, 16, 12), 590, 12, -850)
  add(new THREE.SphereGeometry(9, 16, 12), 615, 12, -850)
  add(new THREE.BoxGeometry(60, 82, 40), 900, 41, -1400)
  add(new THREE.BoxGeometry(50, 70, 40), 980, 35, -1420)
  add(new THREE.BoxGeometry(90, 38, 50), 1080, 19, -1380)

  // Clouds: soft sprites high up
  const cloudTex = softTexture(128, true)
  for (let i = 0; i < 26; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, color: '#fff4ea', transparent: true, opacity: 0.55, depthWrite: false, fog: false }))
    const a = Math.random() * Math.PI - Math.PI * 0.95, d = 2500 + Math.random() * 4500
    sp.position.set(Math.sin(a) * d, 500 + Math.random() * 1400, -Math.abs(Math.cos(a)) * d - 500)
    sp.scale.set(900 + Math.random() * 1200, 160 + Math.random() * 200, 1)
    scene.add(sp)
  }

  const { tower, lights } = buildTower()
  scene.add(tower)
  const arms = [buildArm(-1), buildArm(1)]
  arms.forEach((a) => scene.add(a.pivot))
  const ship = buildShip()
  scene.add(ship.ship)
  const people = buildPeople(game.crew)
  scene.add(people.group)

  // Particles: one additive layer (flames, fire, sparks) and one normal layer (smoke, dust, debris)
  const MAX = 3000
  const makeLayer = (additive) => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX * 3), 3))
    geo.setAttribute('rgba', new THREE.BufferAttribute(new Float32Array(MAX * 4), 4))
    geo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(MAX), 1))
    const mat = new THREE.ShaderMaterial({
      uniforms: { uPx: { value: 400 } },
      vertexShader: `
        attribute float size; attribute vec4 rgba; varying vec4 vC; uniform float uPx;
        void main() { vC = rgba; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = max(2.0, size * uPx / -mv.z); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `
        varying vec4 vC;
        void main() { float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d); gl_FragColor = vec4(vC.rgb, vC.a * a); }`,
      transparent: true,
      depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    })
    const pts = new THREE.Points(geo, mat)
    pts.frustumCulled = false
    scene.add(pts)
    return pts
  }
  const glow = makeLayer(true)
  const puff = makeLayer(false)

  return { renderer, scene, camera, pipCamera, sun, sea, normals, lights, arms, ship, people, glow, puff, camState: null }
}

const colorCache = {}
function rgbOf(hex) {
  if (!colorCache[hex]) {
    const c = new THREE.Color(hex)
    colorCache[hex] = [c.r, c.g, c.b]
  }
  return colorCache[hex]
}

// Copy the game's particles into the two point layers
function updateParticles(w, game) {
  const layers = [w.glow, w.puff]
  const n = [0, 0]
  for (const p of game.particles) {
    if (p.z === undefined) p.z = (Math.random() - 0.5) * 5
    const a = Math.max(0, p.life / p.max)
    let layer, rgb, alpha, size
    switch (p.kind) {
      case 'flame': layer = 0; rgb = [1, 0.93, 0.82]; alpha = a; size = p.size * 2.6; break
      case 'fire': layer = 0; rgb = [1, 0.55, 0.18]; alpha = a; size = p.size * 3.2; break
      case 'spark': layer = 0; rgb = rgbOf(p.color); alpha = Math.min(1, a * 1.5); size = p.size * 2.4; break
      case 'smoke': layer = 1; rgb = [0.92, 0.93, 0.95]; alpha = a * 0.45; size = p.size * (2 - a) * 2.2; break
      case 'dust': layer = 1; rgb = [0.66, 0.58, 0.45]; alpha = a * 0.5; size = p.size * (2 - a) * 2.2; break
      case 'soot': layer = 1; rgb = [0.25, 0.24, 0.23]; alpha = a * 0.65; size = p.size * (2 - a) * 2; break
      default: layer = 1; rgb = p.color ? rgbOf(p.color) : [0.12, 0.13, 0.15]; alpha = Math.min(1, a * 2); size = p.size * 1.3
    }
    const i = n[layer]++
    if (i >= 3000) continue
    const g = layers[layer].geometry.attributes
    g.position.array.set([p.x, p.y, p.z], i * 3)
    g.rgba.array.set([rgb[0], rgb[1], rgb[2], alpha], i * 4)
    g.size.array[i] = size
  }
  layers.forEach((l, k) => {
    const g = l.geometry
    g.setDrawRange(0, Math.min(n[k], 3000))
    g.attributes.position.needsUpdate = g.attributes.rgba.needsUpdate = g.attributes.size.needsUpdate = true
  })
}

// Move everything that changes each frame to match the game state
function syncScene(w, game) {
  const s = game.ship
  const vis = game.phase !== 'crashed'
  w.ship.ship.visible = vis
  w.ship.ship.position.set(s.x, s.y, 0)
  w.ship.ship.rotation.set(0, 0, s.angle)
  const open = game.phase === 'belly' || game.phase === 'ready' ? 1 : game.phase === 'flip' ? 0.5 : 0.15
  for (const f of w.ship.flaps) f.pivot.rotation.x = -f.side * (open * 0.55 + (game.phase === 'belly' ? game.side * f.side * 0.12 : 0))
  const flick = 0.85 + Math.random() * 0.3
  for (const p of w.ship.plumes) {
    p.visible = vis && !!game.firing
    p.scale.set(1.1, 9 * flick, 1.1)
    p.position.y = -1.6 - 4.5 * flick
  }
  for (const j of w.ship.jets) j.mesh.visible = vis && game.side === -j.side

  // Arms swing shut on a catch and dip a little under the weight
  const closed = game.armClose || 0
  const k = game.phase === 'caught' ? game.t - game.endedAt : 0
  const dip = game.phase === 'caught' ? Math.sin(Math.min(k * 9, Math.PI)) * 0.5 * Math.exp(-k * 2) : 0
  const [px, py] = pinPoint(s)
  const lined = game.phase === 'powered' && Math.abs(px - CATCH_X) < 3 && py > ARM_Y && py - ARM_Y < 60
  w.arms.forEach((a, i) => {
    const side = i === 0 ? -1 : 1
    a.pivot.rotation.y = side * ARM_OPEN * (1 - closed)
    a.pivot.position.y = ARM_Y - dip
    a.rail.material.emissive.set(lined || game.phase === 'caught' ? '#2bd673' : '#000000')
  })

  // People: cheer on a catch, run from a crash
  game.crew.forEach((c, i) => {
    const m = w.people.meshes[i]
    const t = game.t * 8 + c.seed * 5
    const hop = game.phase === 'caught' ? Math.abs(Math.sin(t * 0.7)) * 0.6 : 0
    m.group.position.set(c.x, hop, m.z)
  })

  w.lights.visible = Math.sin(game.t * 3) > 0
  w.normals.offset.set(game.t * 0.004, game.t * 0.002)
  updateParticles(w, game)
}

// Drone-style camera: frames the ship and the catch point together from a low angle and drifts slowly around;
// swings in close for the final approach and circles the tower after a catch
export function updateCamera(game, W, H, dt) {
  const s = game.ship
  const cam = game.cam || { pos: null, look: null, t: 0 }
  cam.t += dt
  const center = new THREE.Vector3(s.x - Math.sin(s.angle) * SHIP_H / 2, s.y + Math.cos(s.angle) * SHIP_H / 2, 0)
  const catchPt = new THREE.Vector3(CATCH_X, ARM_Y, 0)
  let look, dist, yaw, height
  const aspect = W / H
  const fit = (extent) => extent / Math.tan(THREE.MathUtils.degToRad(FOV / 2)) / Math.min(1, aspect * 0.8)
  if (game.phase === 'caught' || game.phase === 'landed') {
    const k = game.t - game.endedAt
    look = new THREE.Vector3(CATCH_X + 6, ARM_Y - 20, 0)
    dist = fit(70)
    yaw = 0.3 + k * 0.12
    height = 35
  } else if (slowMo(game)) {
    look = catchPt.clone().add(new THREE.Vector3(0, 4, 0))
    dist = fit(38)
    yaw = 0.62
    height = ARM_Y - 10
  } else {
    look = center.clone().lerp(catchPt, 0.5)
    const span = center.distanceTo(catchPt)
    dist = fit(Math.max(75, span * 0.62 + 40))
    yaw = 0.42 + Math.sin(cam.t * 0.08) * 0.08
    height = Math.max(6, look.y * 0.35)
  }
  // Keep the bottom of the view clear for the telemetry strip by aiming a little low
  look.y -= dist * 0.05
  const pos = new THREE.Vector3(look.x + Math.sin(yaw) * dist, height, look.z + Math.cos(yaw) * dist)
  const k = cam.pos ? Math.min(1, dt * 2.2) : 1
  cam.pos = cam.pos ? cam.pos.lerp(pos, k) : pos
  cam.look = cam.look ? cam.look.lerp(look, k) : look
  game.cam = cam
  return cam
}

export function render(ctx, game, W, H, input) {
  if (!world) world = setup(W, H, game)
  const w = world
  if (w.people.meshes.length !== game.crew.length) {
    w.scene.remove(w.people.group)
    w.people = buildPeople(game.crew)
    w.scene.add(w.people.group)
  }
  const { renderer, scene, camera } = w
  const ratio = renderer.getPixelRatio()
  const size = renderer.getSize(new THREE.Vector2())
  if (size.x !== W || size.y !== H) renderer.setSize(W, H, false)
  syncScene(w, game)

  const cam = game.cam
  camera.aspect = W / H
  camera.updateProjectionMatrix()
  camera.position.copy(cam.pos)
  if (game.phase === 'crashed') {
    const k = Math.max(0, 1 - (game.t - game.endedAt) / 0.7)
    camera.position.add(new THREE.Vector3((Math.random() - 0.5) * 3 * k, (Math.random() - 0.5) * 3 * k, 0))
  }
  camera.lookAt(cam.look)
  // Sun and its shadow box follow the action
  w.sun.target.position.copy(cam.look)
  w.sun.position.copy(cam.look).addScaledVector(SUN_DIR, 600)
  const px = H * ratio / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)))
  w.glow.material.uniforms.uPx.value = px
  w.puff.material.uniforms.uPx.value = px

  renderer.setScissorTest(false)
  renderer.setViewport(0, 0, W, H)
  renderer.render(scene, camera)

  // Tower cam: a fixed camera on the arms, drawn into the top-right corner
  const pip = game.phase === 'powered' || game.phase === 'caught'
  const pw = Math.round(Math.min(W * 0.3, 300)), ph = Math.round(pw * 0.6), pxl = W - pw - 12, pyt = 12
  if (pip) {
    const pc = w.pipCamera
    pc.aspect = pw / ph
    pc.updateProjectionMatrix()
    pc.position.set(CATCH_X - 28, ARM_Y + 8, 58)
    pc.lookAt(CATCH_X, ARM_Y - 14, 0)
    w.glow.material.uniforms.uPx.value = ph * ratio / (2 * Math.tan(THREE.MathUtils.degToRad(16)))
    w.puff.material.uniforms.uPx.value = w.glow.material.uniforms.uPx.value
    renderer.setScissorTest(true)
    renderer.setScissor(pxl, H - pyt - ph, pw, ph)
    renderer.setViewport(pxl, H - pyt - ph, pw, ph)
    renderer.render(scene, pc)
    renderer.setScissorTest(false)
  }

  ctx.drawImage(renderer.domElement, 0, 0, W, H)

  if (pip) {
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'
    ctx.lineWidth = 1
    ctx.strokeRect(pxl + 0.5, pyt + 0.5, pw - 1, ph - 1)
    ctx.fillStyle = '#e3342f'
    ctx.beginPath()
    ctx.arc(pxl + 12, pyt + 13, 3.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'left'
    ctx.font = '700 10px "Saira Condensed", "Arial Narrow", system-ui, sans-serif'
    ctx.fillText('TOWER CAM', pxl + 20, pyt + 17)
  }

  // "CATCH HERE" marker over the arms, projected from 3D onto the screen
  const flying = game.phase === 'ready' || game.phase === 'belly' || game.phase === 'flip' || game.phase === 'powered'
  if (flying && !slowMo(game)) {
    const v = new THREE.Vector3(CATCH_X, ARM_Y + 2, 0).project(camera)
    if (v.z < 1) drawTargetMarker(ctx, (v.x + 1) / 2 * W, (1 - v.y) / 2 * H, game.t)
  }
  filmFinish(ctx, W, H)
}

