# CLAUDE.md

## Project Overview

Personal website for Abhi Tondepu ([abhi-tondepu.com](https://abhi-tondepu.com/)). A content-driven, minimalist portfolio site with pages for writing, books, projects, thoughts, and an about section.

## Tech Stack

- **Framework**: Next.js 14 (Pages Router) with React 18
- **Styling**: Tailwind CSS 3 + CSS Modules (for Thoughts component only)
- **Content**: Markdown files parsed with `marked` and `gray-matter`
- **Analytics**: Vercel Analytics
- **Deployment**: Vercel

## Commands

```bash
npm run dev       # Start development server
npm run turbo     # Start dev server with Turbo mode
npm run build     # Production build
npm start         # Start production server
npm run lint      # Run ESLint
```

## Directory Structure

```
folio/
├── pages/                    # Next.js pages (Pages Router)
│   ├── _app.js               # App wrapper with Layout & Analytics
│   ├── index.js              # Home page (no nav bar)
│   ├── about.js
│   ├── books.js
│   ├── thoughts.js           # getStaticProps: sorts thoughts by timestamp
│   ├── projects.js
│   ├── projects/
│   │   └── easter-egg.js     # Konami code interactive page
│   └── writing/
│       ├── index.js          # getStaticProps: lists all posts, sorted by date
│       └── [slug].js         # getStaticProps + getStaticPaths: renders post
│
├── components/               # React components (PascalCase dirs + index.js)
│   ├── Layout/               # Main wrapper; hides nav on "/"
│   ├── Navigation/           # Sticky header with mobile menu
│   │   ├── index.js          # Scroll detection, mobile state
│   │   ├── NavLinks.js       # Desktop & mobile links (usePathname for active)
│   │   ├── MobileMenu.js     # Backdrop blur overlay
│   │   └── MenuButton.js     # Hamburger / X icon toggle
│   ├── Home/                 # Landing hero with large nav links
│   ├── About/                # Bio and contact email
│   ├── Books/                # Cover images + metadata from data/books.js
│   ├── Writing/
│   │   ├── index.js          # Markdown → HTML renderer (prose styling)
│   │   └── markdown.js       # FS utilities: read MD files, extract metadata
│   ├── Thoughts/
│   │   ├── index.js          # Floating/list display modes with animations
│   │   ├── constants.js      # THOUGHT_CONFIG (28 positioning/animation params)
│   │   └── thoughts.module.css
│   └── Projects/
│       ├── index.js          # Static list of 3 projects
│       └── EasterEgg/        # Konami code + mobile touch detection
│
├── content/
│   └── writing/              # Blog posts as .md files with YAML frontmatter
│
├── data/
│   ├── books.js              # Array of book objects
│   └── thoughts.js           # Array of thought objects
│
├── styles/
│   └── globals.css           # Tailwind directives + font-face + base styles
│
└── public/
    ├── fonts/                # Switzer-Light.woff, PlaywriteITModerna-Regular.ttf
    └── images/
        ├── book-covers/      # JPGs named to match data/books.js cover paths
        └── easter-egg/       # contra-1.png through contra-4.png
```

## Key Conventions

### Code Style
- **Components**: PascalCase directories, each with `index.js` entry point
- **Pages**: Lowercase filenames with hyphens (Next.js convention)
- **Language**: JavaScript (.js), not TypeScript — despite TS being in devDeps, the codebase is plain JS
- No separate `lib/` or `utils/` directory; utilities live alongside the component that owns them (e.g., `components/Writing/markdown.js`)

### Styling
- Use **Tailwind utility classes** for all styling
- CSS Modules only used in `components/Thoughts/thoughts.module.css` for complex keyframe animations and toggle switch
- **Custom color palette** (defined in `tailwind.config.js`):
  - `custom-plum` (#825d73), `custom-rose` (#c06370), `custom-peach` (#fabc72)
  - `custom-sage` (#688a74), `custom-periwinkle` (#7494de), `custom-green` (#197B58)
- **Custom fonts**: `font-switzer` (body text, light weight), `font-playwrite` (cursive accent)
- **Base theme**: Light beige background (#f5ecd9), dark gray text (#333)
- **Hover pattern**: `hover:text-custom-green hover:italic` + smooth transition
- **Section dividers**: `mt-12 pt-6 border-t border-gray-950`
- **Layout width**: `max-w-5xl` container with `px-4 sm:px-6 lg:px-8` padding

### Routing
- Home page (`/`) has no navigation bar — Layout detects route with `useRouter()` and hides nav
- All other pages use the shared `Layout` component with sticky navigation
- `projects/easter-egg` is the only nested page route

### Data Fetching Patterns
- `getStaticProps` is used on `/writing`, `/writing/[slug]`, and `/thoughts`
- `/books`, `/about`, `/projects` are fully static (no data fetching in pages)
- No API routes, no server-side rendering (`getServerSideProps`)

### Navigation Active State
- `NavLinks.js` uses `usePathname()` to detect the current route
- Active link: underline with offset (`underline underline-offset-4`)
- Inactive links: plain text with `hover:text-custom-green hover:italic`

## Component Details

### Layout (`components/Layout/index.js`)
- Wraps every page via `pages/_app.js`
- Hides `<Navigation>` when `pathname === '/'`
- Footer renders copyright year + contact email link
- Container: `max-w-5xl mx-auto`

### Navigation (`components/Navigation/`)
- Sticky header with scroll-triggered box shadow
- Desktop: horizontal `NavLinks`
- Mobile: `MenuButton` (hamburger) toggles `MobileMenu` overlay with backdrop blur
- Mobile menu also shows contact email link at bottom

### Writing (`components/Writing/`)
- `index.js` receives raw markdown string, parses with `gray-matter`, converts to HTML with `marked`, renders with Tailwind prose classes
- `markdown.js` exports:
  - `getFormattedLastModified(filePath)` — reads file mtime, returns "Month Day, Year"
  - `getMarkdownFilesMetadata(dirPath, options)` — reads all `.md` files, supports custom `transformResult`, `getTitle`, and `sortFn` callbacks

### Thoughts (`components/Thoughts/`)
- Two display modes toggled by a switch: **Floating** (animated cards at pseudo-random grid positions) and **List** (vertical stack)
- Mobile always shows list mode
- Floating mode uses 3 CSS keyframe animations cycling by index; hover pauses animation
- Positioning is deterministic based on card index using `THOUGHT_CONFIG` constants
- Respects `prefers-reduced-motion` via media query in CSS Modules

### EasterEgg (`components/Projects/EasterEgg/`)
- Listens for Konami sequence: `↑↑↓↓←→←→`
- Mobile: on-screen directional buttons
- On trigger: spawns 30 random Contra sprites across the viewport, then alerts "30 lives"

## Content / Writing

Blog posts live in `content/writing/` as `.md` files with YAML frontmatter:

```yaml
---
category: String          # optional — shown as prefix in writing list
title: String             # required
date: YYYY-MM-DD          # required — used for sort order
lastModified: YYYY-MM-DD  # required — shown as "Updated" date
decisionDate: YYYY-MM-DD  # optional — for "My Decisions" posts
---
```

- Adding a new `.md` file here automatically creates a route at `/writing/[slug]` — no code changes needed
- The writing index groups posts and can show category-specific descriptions

## Data Files

### `data/books.js`
Array of book objects:
```javascript
{
  title: String,    // display title
  author: String,
  theme: String,    // comma-separated tags
  cover: String,    // path relative to /public, e.g. "/images/book-covers/name.jpg"
  link: String,     // external link (Amazon, etc.)
  review: String    // personal notes
}
```

### `data/thoughts.js`
Array of thought objects:
```javascript
{
  text: String,       // the thought content
  timestamp: String   // human-readable date, e.g. "August 15, 2025"
}
```
Thoughts are sorted newest-first in `pages/thoughts.js` via `getStaticProps`.

## Adding Content

### New blog post
1. Create `content/writing/my-post-slug.md` with proper frontmatter
2. It will automatically appear at `/writing/my-post-slug` — no code changes needed

### New thought
1. Add entry to `data/thoughts.js` with `text` and `timestamp` fields
2. Newer timestamps will appear first (sorted in `getStaticProps`)

### New book
1. Add entry to `data/books.js` with all required fields
2. Place cover image in `public/images/book-covers/` matching the `cover` path in the entry

## Configuration

| File | Purpose |
|------|---------|
| `next.config.js` | Strict mode off, SWC minify on, source maps in dev |
| `tailwind.config.js` | Custom colors, custom fonts, typography plugin |
| `postcss.config.js` | Tailwind + autoprefixer |
| `.env.development` | Disables Next.js telemetry and webpack polling |

## What NOT to Do

- Do not add TypeScript (`.ts`/`.tsx`) files — keep everything as `.js`
- Do not use `getServerSideProps` — all dynamic data is statically generated
- Do not add CSS outside of Tailwind classes or the existing `thoughts.module.css`
- Do not create new CSS Module files for new components — use Tailwind instead
- Do not add a new `lib/` or `utils/` directory — utilities belong next to the component that uses them
