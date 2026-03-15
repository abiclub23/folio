# Dublin Parks Map

Interactive illustrated SVG map of neighborhood parks in Dublin, CA.
Component: `components/DublinParksMap/index.js`
Page: `pages/projects/dublin-parks.js`

## TODO

- [ ] **Park badges** — redesign the hover info card as proper badges/chips; explore a more compact style that fits the illustrated map aesthetic
- [ ] **Real park content** — replace placeholder notes with accurate descriptions for each park; verify official names, notable features, and what makes each one worth visiting

## Ideas to explore

### 1. Scroll-triggered park reveals
Parks fade or pop in as the user scrolls down to the map, rather than appearing all at once. Creates a sense of discovery — each park "appears" on the map as if being drawn. Could animate the badge scale from 0 → 1 with a stagger delay.

### 2. Walking trail overlay
A dashed path connecting the parks in a suggested walking/biking route. Mirrors how the Francis Ranch reference map uses trails to link neighborhoods. Could be toggleable. Fits well with the Alamo Creek and hand-drawn road aesthetic already in place.

### 3. Time-of-day mode
A subtle palette shift between a daytime (current warm green) and golden-hour version of the map. Characters could change too — evening stroll figures instead of midday ones. Triggered by actual time or a manual toggle.

## Explore mode ideas

### 1. Guided park tour
A "Take the tour" button that auto-advances through each park — SVG viewBox animates to zoom into each one, badge pops, info card appears automatically with a short dwell before moving to the next. Slideshow but spatial.

### 2. Follow a character
Click a character (cyclist, dog walker, etc.) and they animate along a path between parks. Camera follows. Each time they stop at a park the info card opens. Makes the map feel alive.

### 3. Route walk mode
Toggled mode that draws a dashed trail connecting all 6 parks in sequence. Click any park to set it as start — trail redraws from there. Could show estimated walk time between stops.

## References
- [Illustrated hand-drawn map storytelling — Esri](https://www.esri.com/arcgis-blog/products/arcgis-storymaps/constituent-engagement/creating-hand-drawn-illustrations-for-story-maps)
- [13 inspiring interactive map examples — Qode](https://www.qodeinteractive.com/magazine/interactive-maps-in-web-design/)
- [Map storytelling approaches — Map Library](https://www.maplibrary.org/1213/diverse-approaches-to-map-storytelling/)
