import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'

const postsDirectory = path.join(process.cwd(), 'posts')

export function getSortedPostsData() {
  // Create posts directory if it doesn't exist
  if (!fs.existsSync(postsDirectory)) {
    fs.mkdirSync(postsDirectory, { recursive: true })
    
    // Create a sample post if no posts exist
    const samplePostContent = `---
title: 'Welcome to My Blog'
date: '2023-01-01'
excerpt: 'This is my first blog post. I plan to write about technology, design, and other topics I find interesting.'
---

# Welcome to My Blog

This is my first blog post on my new personal website. I'm excited to share my thoughts and ideas with you.

## What I'll Be Writing About

- Technology trends and insights
- Design principles and case studies
- Personal projects and experiments
- Books I'm reading and what I'm learning

Stay tuned for more content coming soon!
`
    fs.writeFileSync(path.join(postsDirectory, 'welcome.md'), samplePostContent)
  }

  // Get file names under /posts
  const fileNames = fs.readdirSync(postsDirectory)
  const allPostsData = fileNames.map(fileName => {
    // Remove ".md" from file name to get id
    const id = fileName.replace(/\.md$/, '')

    // Read markdown file as string
    const fullPath = path.join(postsDirectory, fileName)
    const fileContents = fs.readFileSync(fullPath, 'utf8')

    // Use gray-matter to parse the post metadata section
    const matterResult = matter(fileContents)

    // Combine the data with the id
    return {
      id,
      ...matterResult.data
    }
  })
  
  // Sort posts by date
  return allPostsData.sort(({ date: a }, { date: b }) => {
    if (a < b) {
      return 1
    } else if (a > b) {
      return -1
    } else {
      return 0
    }
  })
}

export function getAllPostIds() {
  if (!fs.existsSync(postsDirectory)) {
    fs.mkdirSync(postsDirectory, { recursive: true })
    
    // Create a sample post if no posts exist
    const samplePostContent = `---
title: 'Welcome to My Blog'
date: '2023-01-01'
excerpt: 'This is my first blog post. I plan to write about technology, design, and other topics I find interesting.'
---

# Welcome to My Blog

This is my first blog post on my new personal website. I'm excited to share my thoughts and ideas with you.

## What I'll Be Writing About

- Technology trends and insights
- Design principles and case studies
- Personal projects and experiments
- Books I'm reading and what I'm learning

Stay tuned for more content coming soon!
`
    fs.writeFileSync(path.join(postsDirectory, 'welcome.md'), samplePostContent)
  }
  
  const fileNames = fs.readdirSync(postsDirectory)
  
  return fileNames.map(fileName => {
    return {
      params: {
        id: fileName.replace(/\.md$/, '')
      }
    }
  })
}

export async function getPostData(id) {
  const fullPath = path.join(postsDirectory, `${id}.md`)
  
  // Check if the file exists
  if (!fs.existsSync(fullPath)) {
    return {
      id,
      contentHtml: '<p>Post not found</p>',
      title: 'Post Not Found',
      date: '',
      excerpt: ''
    }
  }
  
  const fileContents = fs.readFileSync(fullPath, 'utf8')

  // Use gray-matter to parse the post metadata section
  const matterResult = matter(fileContents)

  // Use remark to convert markdown into HTML string
  const processedContent = await remark()
    .use(html)
    .process(matterResult.content)
  const contentHtml = processedContent.toString()

  // Combine the data with the id and contentHtml
  return {
    id,
    contentHtml,
    ...matterResult.data
  }
} 