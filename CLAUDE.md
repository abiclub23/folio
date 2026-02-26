# CLAUDE.md

## Project Overview

Personal website for Abhi Tondepu ([abhi-tondepu.com](https://abhi-tondepu.com/)). Minimalist portfolio with writing, books, projects, thoughts, and about pages.

## Tech Stack

- **Framework**: Next.js 14 (Pages Router), React 18
- **Styling**: Tailwind CSS 3 + CSS Modules (Thoughts component only)
- **Content**: Markdown via `marked` + `gray-matter`
- **Deployment**: Vercel + Vercel Analytics

## Key Conventions

- **Language**: Plain JavaScript (.js) — TypeScript is in devDeps but not used
- **Components**: PascalCase directories with `index.js` entry point
- **Pages**: lowercase filenames (Next.js convention)
- **Styling**: Tailwind everywhere; CSS Modules only in `components/Thoughts/`
- **Hover pattern**: `hover:text-custom-green hover:italic` + smooth transition
- **Layout**: `max-w-5xl` container, `px-4 sm:px-6 lg:px-8` padding
- **Home page** (`/`): no navigation bar — Layout hides nav when `pathname === '/'`
- **No TypeScript, no SSR (`getServerSideProps`), no new CSS Module files**

## Adding Content

### New blog post
1. Create `content/writing/my-post-slug.md` with frontmatter (see below)
2. Route `/writing/my-post-slug` appears automatically — no code changes needed

### New thought
Add to `data/thoughts.js`: `{ text: String, timestamp: String }` — sorted newest-first.

### New book
Add to `data/books.js`: `{ title, author, theme, cover, link, review }` and place cover in `public/images/book-covers/`.

## Content Frontmatter Schema

```yaml
---
title: String             # required
date: YYYY-MM-DD          # required — sort order
lastModified: YYYY-MM-DD  # required
category: String          # optional — shown as prefix in listing
decisionDate: YYYY-MM-DD  # optional — for "My Decisions" posts
---
```

## Writing Style

- **Voice**: First person, conversational — write like you're talking to a friend
- **First sentence**: Hook immediately — don't ease in, start with the point or an interesting fact
- **Sentences**: One thought per sentence; short to medium length; no filler phrases
- **Words**: Plain everyday words; no jargon unless explained; every word earns its place
- **Structure**: Use numbered lists to organize — already a natural habit; use headers for longer posts
- **Specificity**: Concrete details over vague generalities (name the place, the car, the dollar amount)
- **Humor**: Light and natural — don't force it
- **Length**: As short as it needs to be; trim anything that doesn't add meaning

## Project Structure (top-level only)

```
pages/          # Next.js routes
components/     # React components (PascalCase/index.js)
content/writing/ # Markdown blog posts
data/           # books.js, thoughts.js
styles/         # globals.css (Tailwind directives + font-face)
public/         # fonts/, images/book-covers/, images/easter-egg/
```
