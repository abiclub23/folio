import fs from 'fs';
import path from 'path';

/**
 * Gets the formatted last modified date of a file
 * @param {string} filePath - Path to the file
 * @returns {string} Formatted date string
 */
export function getFormattedLastModified(filePath) {
  const stats = fs.statSync(filePath);
  return new Date(stats.mtime).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Gets metadata for markdown files in a directory
 * @param {string} dirPath - Path to the directory containing markdown files
 * @param {Object} options - Configuration options
 * @param {Function} options.getTitle - Function to extract title from file content
 * @param {Function} options.transformResult - Function to transform the result object
 * @param {Function} options.sortFn - Function to sort the results
 * @returns {Array} Array of file metadata objects
 */
export function getMarkdownFilesMetadata(dirPath, options = {}) {
  const {
    getTitle = (content) => content.split('\n')[0].replace('# ', ''),
    transformResult = (result) => result,
    sortFn = null
  } = options;

  const files = fs.readdirSync(dirPath);
  
  let results = files
    .filter(file => file.endsWith('.md'))
    .map(file => {
      const slug = file.replace('.md', '');
      const filePath = path.join(dirPath, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const lastModified = getFormattedLastModified(filePath);
      
      const baseResult = {
        slug,
        lastModified,
        content,
        title: getTitle(content)
      };

      return transformResult(baseResult);
    });

  if (sortFn) {
    results = results.sort(sortFn);
  }

  return results;
} 