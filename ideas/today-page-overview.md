# /today Page - AI-Generated Dynamic Experience

## Overview
An experimental page that showcases generative AI creativity through JSON-driven configurations. The page regenerates with different layouts, moods, animations, and navigation styles.

## Core Concept
"My site showcases generative AI creativity"

## Architecture

### Flow
```
1. Claude AI generates JSON config (manual for now)
   ↓
2. Save to /data/today.json
   ↓
3. Page reads JSON via getStaticProps at build time
   ↓
4. Components map config values to visual presets
   ↓
5. Render unique layout with animations
```

### Files Created
```
/pages/today.js                                    # Route (no layout wrapper)
/components/Today/index.js                         # Main renderer
/components/Today/presets.js                       # Style presets
/components/Today/animations/FloatAnimation.js     # Framer Motion float
/components/Today/animations/GlitchAnimation.js    # Glitch effects
/components/Today/animations/ParticlesBackground.js # Three.js particles
/components/Today/animations/WavesBackground.js    # Three.js waves
/data/today.json                                   # Current config
```

### Files Modified
```
/pages/_app.js  # Skip layout for /today (page renders own nav)
```

## Current JSON Schema

```json
{
  "headline": string,
  "subheadline": string,
  "mood": "calm" | "weird" | "bold",
  "layout": "center" | "split",
  "accent": "mono" | "blue" | "green",
  "animation": {
    "type": "float" | "particles" | "glitch" | "waves" | "none",
    "intensity": "low" | "medium" | "high",
    "interactive": boolean
  },
  "navigation": {
    "style": "floating" | "minimal" | "hidden" | "traditional",
    "position": "top" | "bottom" | "side"
  },
  "generatedNote": string
}
```

## Implemented Features

### Mood Presets
- **calm**: Soft colors, centered, slow transitions, opacity hover
- **weird**: Rotated text (-2deg), playful hovers, asymmetric
- **bold**: Large text (text-8xl+), high contrast, dramatic hovers

### Layout Presets
- **center**: Centered column, symmetric
- **split**: 2-column grid, asymmetric

### Accent Presets
- **mono**: Grayscale (gray-50 bg)
- **blue**: Periwinkle (#7494de)
- **green**: Sage/green (#688a74, #197B58)

### Navigation Styles
- **floating**: Pill-shaped, backdrop blur, absolute positioned
- **minimal**: Simple absolute positioning
- **hidden**: No navigation
- **traditional**: Full-width border-bottom

### Animation Types (Implemented)
1. **float**: Gentle vertical bobbing (Framer Motion)
2. **particles**: 3D particle system (Three.js - SSR disabled)
3. **glitch**: Digital glitch with RGB split
4. **waves**: Animated 3D wave geometry (Three.js - SSR disabled)

## Dependencies Installed
```bash
npm install framer-motion @react-three/fiber @react-three/drei three --legacy-peer-deps
```

## How to Use

### Generate New Config
Ask Claude:
```
Generate a config for /today using the generation prompt
```

### Update Page
1. Copy JSON to `/data/today.json`
2. Dev server hot-reloads automatically
3. Visit `http://localhost:3000/today`

## Generation Prompt (Current)

```
You are a generative config engine for a playful, minimal personal homepage with animations.

Output a single valid JSON object and nothing else.

JSON schema: [see above]

Rules:
1. The subheadline MUST reference: Writing, Books, Projects, About (creative ways okay)
2. Headlines should be playful, abstract, or inventive
3. Tone: playful, slightly weird, experimental
4. Get creative with animation types - match them to the mood
5. Navigation style should complement the overall aesthetic
6. generatedNote should be vibe text
7. Avoid buzzwords, marketing language, emojis, AI mentions
8. Be bold and inventive!

Respond with JSON only.
```

## Example Variations

### Particles in Space
```json
{
  "headline": "floating in space",
  "subheadline": "writing · books · projects · about",
  "mood": "calm",
  "layout": "center",
  "accent": "blue",
  "animation": {
    "type": "particles",
    "intensity": "high",
    "interactive": false
  },
  "navigation": {
    "style": "floating",
    "position": "bottom"
  },
  "generatedNote": "made while orbiting"
}
```

### Glitch Matrix
```json
{
  "headline": "SYSTEM_ONLINE",
  "subheadline": "WRITING /// BOOKS /// PROJECTS /// ABOUT",
  "mood": "bold",
  "layout": "split",
  "accent": "mono",
  "animation": {
    "type": "glitch",
    "intensity": "high",
    "interactive": true
  },
  "navigation": {
    "style": "minimal",
    "position": "side"
  },
  "generatedNote": "transmission intercepted at 03:47"
}
```

## Technical Notes

### SSR Considerations
- Three.js components must use `dynamic` import with `ssr: false`
- Pattern: `const Component = dynamic(() => import('./Component'), { ssr: false })`
- This prevents "Cannot read properties of undefined" errors

### Next.js Cache
- If you get `getStaticPaths` errors, clear cache: `rm -rf .next`
- Restart dev server

### Performance
- Framer Motion animations are lightweight
- Three.js adds ~60 packages but dynamically loaded
- All animations use GPU acceleration where possible

## Status
✅ **Working**: All 4 animation types functional
✅ **Custom nav**: Independent from main site
✅ **Hot reload**: Changes to JSON update instantly
✅ **Mobile responsive**: All layouts adapt

## Next Steps
See `ideas/future-animations.md` for planned expansion
