import path from 'path';
import fs from 'fs';
import Article from '../../components/tiwid/Article';

export default function ArticlePage({ content, slug }) {
  return <Article content={content} title={slug} />;
}

export async function getStaticPaths() {
  const dirPath = path.join(process.cwd(), 'content/writing');
  const files = fs.readdirSync(dirPath);
  
  const paths = files.map((filename) => ({
    params: {
      slug: filename.replace('.md', '')
    }
  }));

  return {
    paths,
    fallback: false
  };
}

export async function getStaticProps({ params }) {
  const { slug } = params;
  const filePath = path.join(process.cwd(), 'content/writing', `${slug}.md`);
  const content = fs.readFileSync(filePath, 'utf8');

  return {
    props: {
      content,
      slug
    }
  };
} 