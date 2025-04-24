# Site Structure Documentation

## Overview
This is a Next.js-based personal website with a focus on writing, books, and projects. The site features a responsive design with mobile navigation support.

## Page Structure
- `/` (Home) - Main landing page
- `/about` - About page
- `/books` - Book recommendations and reviews
- `/projects` - Projects showcase
- `/writing` - Blog/writing section with dynamic routing for individual posts

## Component Architecture

### Navigation
- `NavLinks.js` - Main navigation links component
- `MobileMenu.js` - Mobile-specific navigation menu
- `MenuButton.js` - Mobile menu toggle button
- `index.js` - Navigation component exports and organization

### Writing
- `index.js` - Main writing component
- `markdown.js` - Markdown rendering functionality for blog posts


### Layout
- Contains shared layout components for consistent site structure
- Consistent spacing and borders across sections
- Responsive design patterns

### Home
- Homepage-specific components
- Large, hoverable navigation links
- Minimalist design

### Projects
- Project showcase components

### About
- About page components
- Personal introduction
- Contact information

## Content Structure

### Writing Content Organization
- Location: `/content/writing/`
- File Format: Markdown (`.md`)
- Frontmatter Structure:
  ```yaml
  ---
  category: [Category Name]
  title: [Post Title]
  date: [YYYY-MM-DD]
  lastModified: [YYYY-MM-DD]
  ---
  ```

### Content Management
- Static content generation
- Automatic date tracking
- Category-based organization
- Responsive image handling
- SEO-friendly structure

## Technical Stack
- Next.js for the framework
- React for UI components
- Markdown support for blog posts
- Responsive design with mobile-first approach
- Tailwind CSS for styling

## Styling & Design System
- **Framework**: Tailwind CSS with custom configuration
- **Typography**:
  - Primary Font: Switzer (custom font)
- **Base Styles**:
  - Background: Light beige (#f5ecd9)
  - Text: Dark gray (#333)
  - Responsive breakpoints using Tailwind's default system
- **Component Styling**:
  - Mobile-first approach
  - Consistent spacing using Tailwind's spacing scale
  - Hover effects: italic text for interactive elements
  - Border styles: Consistent use of border-gray-950
  - Backdrop blur effects for mobile menu
  - Section spacing: mt-12 pt-6 border-t border-gray-950
- **Markdown Styling**:
  - Custom prose styles using @tailwindcss/typography
  - Consistent heading hierarchy
  - Custom paragraph and list styling

## Key Features
1. Dynamic routing for blog posts (`[slug].js`)
2. Mobile-responsive navigation
3. Markdown-based content management
4. Modular component structure
5. Clean separation of concerns between pages and components
6. Consistent styling and spacing across sections

## File Organization
- `/components` - Reusable UI components
- `/pages` - Next.js page components
- `/styles` - Global styles and Tailwind configuration
- `/docs/llm` - Documentation and reference materials 