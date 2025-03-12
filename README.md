# Personal Website

A simple, responsive personal website with blogging functionality built with Next.js and Tailwind CSS.

## Features

- Responsive design that works on all devices
- Fast loading times with static site generation
- Blog functionality with Markdown support
- Easy to customize and extend

## Getting Started

### Prerequisites

- Node.js 14.6.0 or newer
- npm or yarn

### Installation

1. Clone this repository or download the files
2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Customization

### Personal Information

- Edit your name, profession, and location in the layout component (`components/Layout.js`)
- Update your social media links in the footer
- Customize your about page (`pages/about.js`)

### Blog Posts

Blog posts are stored as Markdown files in the `posts` directory. Each post should include frontmatter with:

```markdown
---
title: 'Your Post Title'
date: 'YYYY-MM-DD'
excerpt: 'A brief description of your post'
---

Your content here...
```

## Deployment

This site can be easily deployed to Vercel, Netlify, or GitHub Pages.

### Deploying to Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

1. Push your code to a GitHub repository
2. Import your repository to Vercel
3. Vercel will automatically detect Next.js and deploy your site

### Deploying to Netlify

1. Push your code to a GitHub repository
2. Log in to Netlify and click "New site from Git"
3. Select your repository
4. Use these build settings:
   - Build command: `npm run build`
   - Publish directory: `out`
5. Add an environment variable: `NETLIFY_NEXT_PLUGIN_SKIP=true`
6. Deploy your site

## License

This project is open source and available under the [MIT License](LICENSE).

## Next Steps

- Add a contact form
- Implement a newsletter subscription
- Add image optimization
- Implement a dark mode toggle
- Add categories and tags to blog posts 