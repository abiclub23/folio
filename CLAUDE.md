# CLAUDE.md

## Project Overview

Personal website for Abhi Tondepu ([abhi-tondepu.com](https://abhi-tondepu.com/)). A content-driven, minimalist portfolio site with pages for writing, books, projects, thoughts, and an about section.

## Tech Stack

- **Framework**: Next.js 14 (Pages Router) with React 18
- **Styling**: Tailwind CSS 3 + CSS Modules (for Thoughts component)
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

## Key Conventions

### Code Style
- **Components**: PascalCase directories, each with `index.js` entry point
- **Pages**: Lowercase filenames with hyphens (Next.js convention)
- **Language**: JavaScript (.js), not TypeScript — despite TS being in devDeps, the codebase is plain JS

### Styling
- Use **Tailwind utility classes** for all styling
- CSS Modules only used in `components/Thoughts/thoughts.module.css` for complex animations
- **Custom color palette** (defined in `tailwind.config.js`):
  - `custom-plum` (#825d73), `custom-rose` (#c06370), `custom-peach` (#fabc72)
  - `custom-sage` (#688a74), `custom-periwinkle` (#7494de), `custom-green` (#197B58)
- **Custom fonts**: `font-switzer` (body text), `font-playwrite` (cursive accent)
- **Base theme**: Light beige background (#f5ecd9), dark gray text (#333)
- **Hover pattern**: Italic text + green color + smooth transition
- **Section dividers**: `mt-12 pt-6 border-t border-gray-950`
- **Layout width**: `max-w-5xl` container with padding

### Content / Writing
- Blog posts live in `content/writing/` as `.md` files
- Frontmatter schema:
  ```yaml
  ---
  category: String       # optional
  title: String          # required
  date: YYYY-MM-DD       # required
  lastModified: YYYY-MM-DD  # required
  decisionDate: YYYY-MM-DD  # optional, for decision posts
  ---
  ```

### Data Files
- `data/books.js` — Array of book objects: `{ title, author, theme, cover, link, review }`
- `data/thoughts.js` — Array of thought objects: `{ text, timestamp }`

### Routing
- Home page (`/`) has no navigation bar — unique layout
- All other pages use the shared `Layout` component with sticky navigation

## Adding Content

### New blog post
1. Create `content/writing/my-post-slug.md` with proper frontmatter
2. It will automatically appear at `/writing/my-post-slug` — no code changes needed

### New thought
1. Add entry to `data/thoughts.js` with `text` and `timestamp` fields

### New book
1. Add entry to `data/books.js` with all required fields
2. Place cover image in `public/images/book-covers/`


