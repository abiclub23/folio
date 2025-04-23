import path from 'path';
import fs from 'fs';
import Article from '../../components/Writing';

export default function WritingPage({ content, metadata }) {
  return <Article content={content} title={metadata.title} />;
}

export async function getStaticPaths() {
  const dirPath = path.join(process.cwd(), 'content/writing');
  const files = fs.readdirSync(dirPath);
  
  const paths = files.map(filename => ({
    params: { slug: filename.replace('.md', '') }
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
      metadata: { title: slug }
    }
  };
} 