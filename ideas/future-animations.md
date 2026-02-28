# Future Animation Ideas for /today Page

## Planned Animation Types

All variations below are ready to implement. Each includes example JSON config.

---

## 1. Liquid Distortion
**Technology**: WebGL shader with displacement mapping
**Effect**: Text and elements appear to melt, drip, or flow like liquid

### Implementation Notes
- Use displacement shader for smooth distortion
- Interactive: Mouse movement creates ripples
- Viscosity control (low/medium/high)

### Example Config
```json
{
  "headline": "melting",
  "subheadline": "words drip · pages flow · code liquifies · thoughts dissolve",
  "mood": "weird",
  "layout": "center",
  "accent": "blue",
  "animation": {
    "type": "liquid",
    "intensity": "high",
    "interactive": true,
    "viscosity": "high",
    "ripple": true
  },
  "navigation": {
    "style": "floating",
    "position": "top",
    "distort": true
  },
  "generatedNote": "everything flows eventually"
}
```

---

## 2. Chromatic Aberration
**Technology**: CSS filters + transforms or WebGL
**Effect**: RGB color channels split and drift apart

### Implementation Notes
- Separate R, G, B channels with offset
- Horizontal/vertical/radial drift patterns
- Interactive: Mouse position affects split intensity

### Example Config
```json
{
  "headline": "R̴G̵B̶",
  "subheadline": "w͎r͎i͎t͎i͎n͎g͎ / b͎o͎o͎k͎s͎ / p͎r͎o͎j͎e͎c͎t͎s͎ / a͎b͎o͎u͎t͎",
  "mood": "bold",
  "layout": "split",
  "accent": "mono",
  "animation": {
    "type": "chromatic",
    "intensity": "high",
    "interactive": true,
    "rgbSplit": 25,
    "drift": "horizontal"
  },
  "navigation": {
    "style": "minimal",
    "position": "bottom",
    "aberration": true
  },
  "generatedNote": "colors separated at birth"
}
```

---

## 3. Hologram / Scanlines
**Technology**: CSS overlays + SVG filters
**Effect**: Retro hologram with scanlines, flicker, rainbow shimmer

### Implementation Notes
- Horizontal scanline overlay
- Random flicker effect
- RGB rainbow shimmer on edges
- CRT-style distortion

### Example Config
```json
{
  "headline": "◈◈◈ TRANSMISSION ◈◈◈",
  "subheadline": "▓▓▓ writing ▓▓▓ books ▓▓▓ projects ▓▓▓ about ▓▓▓",
  "mood": "bold",
  "layout": "center",
  "accent": "green",
  "animation": {
    "type": "hologram",
    "intensity": "medium",
    "interactive": false,
    "scanlines": true,
    "flicker": true,
    "rainbow": true
  },
  "navigation": {
    "style": "hidden",
    "position": "top"
  },
  "generatedNote": "signal strength: 47%"
}
```

---

## 4. Morph Text
**Technology**: anime.js or GSAP MorphSVG
**Effect**: Text transforms into different words/shapes

### Implementation Notes
- Sequence of text transformations
- Smooth letter-by-letter morphing
- Speed control (slow/medium/fast)
- Can morph navigation too

### Example Config
```json
{
  "headline": "shapeshifter",
  "subheadline": "writing → books → projects → about → ∞",
  "mood": "weird",
  "layout": "center",
  "accent": "blue",
  "animation": {
    "type": "morph",
    "intensity": "medium",
    "interactive": true,
    "sequence": ["hello", "hola", "bonjour", "ciao", "你好"],
    "speed": "slow"
  },
  "navigation": {
    "style": "floating",
    "position": "side",
    "morph": true
  },
  "generatedNote": "nothing stays the same"
}
```

---

## 5. Image Background Blend
**Technology**: CSS background-blend-mode + parallax
**Effect**: Images layered with blend modes, subtle parallax scroll

### Implementation Notes
- Support for custom images or generated gradients
- Blend modes: multiply, screen, overlay, difference
- Parallax scroll effect
- Opacity control

### Example Config
```json
{
  "headline": "layered realities",
  "subheadline": "writing · books · projects · about",
  "mood": "calm",
  "layout": "split",
  "accent": "mono",
  "animation": {
    "type": "image-blend",
    "intensity": "low",
    "interactive": true,
    "image": "abstract-gradient",
    "blend": "multiply",
    "opacity": 0.3,
    "parallax": true
  },
  "navigation": {
    "style": "traditional",
    "position": "top",
    "glass": true
  },
  "generatedNote": "composited at dawn"
}
```

---

## 6. Cursor Trails / Interactive Particles
**Technology**: Canvas API or Framer Motion
**Effect**: Sparkles, trails, or magnetic particles follow cursor

### Implementation Notes
- Canvas-based particle system
- Trail types: sparkles, smoke, ribbons, dots
- Magnetic attraction to cursor
- Fade/lifetime control

### Example Config
```json
{
  "headline": "follow the light",
  "subheadline": "writing ✦ books ✦ projects ✦ about",
  "mood": "calm",
  "layout": "center",
  "accent": "blue",
  "animation": {
    "type": "cursor-trail",
    "intensity": "high",
    "interactive": true,
    "trail": "sparkles",
    "magnetic": true,
    "fade": "slow"
  },
  "navigation": {
    "style": "floating",
    "position": "bottom",
    "magnetic": true
  },
  "generatedNote": "move your mouse everywhere"
}
```

---

## 7. SVG Noise / Turbulence
**Technology**: SVG filters (feTurbulence, feDisplacementMap)
**Effect**: Organic noise patterns, TV static, texture

### Implementation Notes
- SVG feTurbulence for noise generation
- feDisplacementMap for distortion
- Animated noise evolution
- Frequency and scale control

### Example Config
```json
{
  "headline": "static",
  "subheadline": "wr̵i̴t̷i̶ng ̸· ̴bo̴o̶ks̷ ̷· ̸pr̴o̶je̶c̵t̸s ̶· ̵ab̷o̸u̴t",
  "mood": "weird",
  "layout": "split",
  "accent": "green",
  "animation": {
    "type": "noise",
    "intensity": "high",
    "interactive": false,
    "turbulence": 0.8,
    "frequency": 0.05,
    "evolve": true
  },
  "navigation": {
    "style": "minimal",
    "position": "side",
    "noise": true
  },
  "generatedNote": "signal corrupted"
}
```

---

## 8. WebGL Shader / Fractal
**Technology**: Three.js ShaderMaterial or custom WebGL
**Effect**: Fractal patterns (Mandelbrot, Julia), infinite zoom

### Implementation Notes
- Fragment shader for fractal math
- Interactive zoom with mouse/scroll
- Color mapping (psychedelic, monochrome, etc.)
- Infinite zoom animation

### Example Config
```json
{
  "headline": "∞",
  "subheadline": "words within words within words within words",
  "mood": "bold",
  "layout": "center",
  "accent": "mono",
  "animation": {
    "type": "fractal",
    "intensity": "high",
    "interactive": true,
    "pattern": "mandelbrot",
    "zoom": "infinite",
    "colors": "psychedelic"
  },
  "navigation": {
    "style": "hidden",
    "position": "top"
  },
  "generatedNote": "zoom forever"
}
```

---

## 9. Shatter / Explode
**Technology**: Physics engine (Matter.js) or custom particles
**Effect**: Elements break into pieces on interaction

### Implementation Notes
- Voronoi shatter pattern
- Physics simulation for pieces
- Trigger: click, hover, scroll, or automatic
- Reform animation option

### Example Config
```json
{
  "headline": "BREAK",
  "subheadline": "WRITING /// BOOKS /// PROJECTS /// ABOUT",
  "mood": "bold",
  "layout": "split",
  "accent": "mono",
  "animation": {
    "type": "shatter",
    "intensity": "high",
    "interactive": true,
    "trigger": "click",
    "pieces": 100,
    "physics": true
  },
  "navigation": {
    "style": "floating",
    "position": "top",
    "shatter": "on-hover"
  },
  "generatedNote": "click to destroy"
}
```

---

## 10. Aurora / Light Rays
**Technology**: Canvas gradients or WebGL
**Effect**: Northern lights-style flowing gradients

### Implementation Notes
- Flowing gradient waves
- Multiple color layers
- Smooth color transitions
- Glow/bloom effects

### Example Config
```json
{
  "headline": "northern lights",
  "subheadline": "writing · books · projects · about",
  "mood": "calm",
  "layout": "center",
  "accent": "blue",
  "animation": {
    "type": "aurora",
    "intensity": "medium",
    "interactive": false,
    "colors": ["#00ffaa", "#aa00ff", "#ff00aa"],
    "flow": "wave",
    "glow": true
  },
  "navigation": {
    "style": "floating",
    "position": "bottom",
    "glow": "aurora"
  },
  "generatedNote": "made under electric skies"
}
```

---

## 11. Pixelate / Mosaic
**Technology**: Canvas pixel manipulation or CSS
**Effect**: 8-bit style pixelation, retro aesthetic

### Implementation Notes
- Dynamic pixel size control
- 8-bit color palette option
- Pixelation on hover/interaction
- Glitch transitions

### Example Config
```json
{
  "headline": "█ █ █",
  "subheadline": "writing▓books▓projects▓about",
  "mood": "weird",
  "layout": "split",
  "accent": "green",
  "animation": {
    "type": "pixelate",
    "intensity": "high",
    "interactive": true,
    "pixelSize": "dynamic",
    "color": "8bit",
    "glitch": true
  },
  "navigation": {
    "style": "minimal",
    "position": "side",
    "pixelated": true
  },
  "generatedNote": "8-bit dreams"
}
```

---

## 12. Dissolve / Particle Text
**Technology**: Canvas particles or WebGL points
**Effect**: Text breaks into particles, reforms, dust effects

### Implementation Notes
- Text converted to particle positions
- Physics simulation (wind, gravity)
- Reform/reassemble animation
- Particle trails

### Example Config
```json
{
  "headline": "dust",
  "subheadline": "writing ⋅⋅⋅ books ⋅⋅⋅ projects ⋅⋅⋅ about",
  "mood": "calm",
  "layout": "center",
  "accent": "mono",
  "animation": {
    "type": "dissolve",
    "intensity": "medium",
    "interactive": true,
    "particles": 1000,
    "wind": "gentle",
    "reform": true
  },
  "navigation": {
    "style": "floating",
    "position": "top",
    "dissolve": "on-hover"
  },
  "generatedNote": "we are all stardust"
}
```

---

## Implementation Priority

### Phase 1 (Quick Wins)
1. **Chromatic Aberration** - CSS-based, easy
2. **Cursor Trails** - Canvas, engaging
3. **Hologram** - SVG filters, retro cool

### Phase 2 (Medium Complexity)
4. **Pixelate** - Canvas manipulation
5. **Morph Text** - Library integration
6. **Image Blend** - CSS + parallax

### Phase 3 (Advanced)
7. **Liquid** - WebGL shader
8. **Dissolve** - Particle system
9. **Aurora** - Gradient animation

### Phase 4 (Complex)
10. **Shatter** - Physics engine
11. **Noise** - SVG filters advanced
12. **Fractal** - WebGL shaders

## Additional Ideas

### Combination Effects
- **Chromatic + Glitch** = cyberpunk aesthetic
- **Particles + Aurora** = cosmic vibes
- **Liquid + Dissolve** = water theme
- **Hologram + Noise** = degraded transmission

### Seasonal Variations
- **Winter**: Snowfall particles, ice crystals
- **Spring**: Flowers dissolving/blooming
- **Summer**: Heat waves, liquid shimmer
- **Fall**: Leaves falling, color transitions

### Time-Based
- **Dawn**: Aurora, soft colors
- **Day**: Bright, minimal
- **Dusk**: Chromatic aberration, warm tones
- **Night**: Particles, hologram, stars

## Technical Stack for Future

### Libraries to Consider
- **anime.js** - Text morphing, complex animations
- **GSAP** - Professional animations, MorphSVG
- **Matter.js** - Physics for shatter effect
- **p5.js** - Creative coding, generative art
- **PixiJS** - 2D WebGL, performance
- **Three.js Postprocessing** - Advanced shaders

### Performance Optimization
- Lazy load animation libraries
- Use web workers for heavy computations
- GPU acceleration via CSS `will-change`
- Reduce particle counts on mobile
- Intersection Observer to pause off-screen

## Notes for Future Implementation

1. **Mobile Considerations**: Reduce intensity on mobile, disable some effects
2. **Accessibility**: Respect `prefers-reduced-motion`
3. **Performance**: Monitor FPS, provide fallbacks
4. **Browser Support**: Test WebGL availability, provide graceful degradation
5. **Loading States**: Show loading indicators for heavy effects

## Extended JSON Schema (Future)

```typescript
{
  headline: string
  subheadline: string
  mood: "calm" | "weird" | "bold"
  layout: "center" | "split" | "scattered" | "grid"
  accent: "mono" | "blue" | "green" | "custom"
  animation: {
    type: "float" | "particles" | "glitch" | "waves" |
          "liquid" | "chromatic" | "hologram" | "morph" |
          "image-blend" | "cursor-trail" | "noise" | "fractal" |
          "shatter" | "aurora" | "pixelate" | "dissolve"
    intensity: "low" | "medium" | "high"
    interactive: boolean
    // Type-specific properties
    [key: string]: any
  }
  navigation: {
    style: "floating" | "minimal" | "hidden" | "traditional"
    position: "top" | "bottom" | "side"
    effects?: string[]
  }
  background?: {
    type: "solid" | "gradient" | "image" | "video"
    value: string
    blend?: string
  }
  generatedNote: string
}
```
