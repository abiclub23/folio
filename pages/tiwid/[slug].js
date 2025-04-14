import fs from 'fs';
import path from 'path';
import Article from '../../components/tiwid/Article';

export const metadata = {
  title: 'This Is What I Did | Abhi Tondepu',
};

export default function ArticlePage({ content, title }) {
  return <Article content={content} title={title} />;
}

export async function getStaticPaths() {
  const dirPath = path.join(process.cwd(), 'content/tiwid');
  const files = fs.readdirSync(dirPath);
  
  const paths = files
    .filter(file => file.endsWith('.md'))
    .map(file => ({
      params: {
        slug: file.replace('.md', ''),
      },
    }));

  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const { slug } = params;
  const filePath = path.join(process.cwd(), 'content/tiwid', `${slug}.md`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const title = content.split('\n')[0].replace('# ', '');
    
    return {
      props: {
        content,
        title,
      },
    };
  } catch (error) {
    return {
      notFound: true,
    };
  }
} 