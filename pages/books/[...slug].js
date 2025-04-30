import { serialize } from 'next-mdx-remote/serialize';
import { MDXRemote } from 'next-mdx-remote';
import path from 'path';
import matter from 'gray-matter';
import MDRenderer from '../../components/MDRenderer';
import Link from 'next/link';

export default function BookPage({ source, frontMatter }) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Link href="/">
          <div className="text-blue-600 hover:text-blue-800 cursor-pointer inline-flex items-center">
            <span className="mr-2">←</span>
            홈으로 돌아가기
          </div>
        </Link>
      </div>
      <h1 className="text-4xl font-bold mb-8">{frontMatter.title}</h1>
      <div className="text-gray-400 mb-8">최종수정일: {frontMatter.date}</div>
      <MDRenderer content={source} />
    </div>
  );
}

export async function getStaticPaths() {
  const fs = await import('fs/promises');
  const booksDirectory = path.join(process.cwd(), 'books');
  const paths = [];

  async function processDirectory(dir, basePath = []) {
    const items = await fs.readdir(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stats = await fs.stat(fullPath);
      
      if (stats.isDirectory()) {
        await processDirectory(fullPath, [...basePath, item]);
      } else if (item.endsWith('.md') && item !== 'README.md') {
        const slug = [...basePath, item.replace(/\.md$/, '')];
        paths.push({
          params: { slug },
        });
      }
    }
  }

  await processDirectory(booksDirectory);
  
  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const fs = await import('fs/promises');
  const { slug } = params;
  const booksDirectory = path.join(process.cwd(), 'books');
  
  // 파일 경로 생성 (마지막 요소에 .md 추가)
  const filePath = path.join(booksDirectory, ...slug.slice(0, -1), slug[slug.length - 1] + '.md');
  
  try {
    // 파일 존재 여부 확인
    const stats = await fs.stat(filePath);
    
    if (!stats.isFile()) {
      console.error('File is not a regular file:', filePath);
      return {
        notFound: true,
      };
    }

    // 파일 내용 읽기
    const fileContents = await fs.readFile(filePath, 'utf8');
    const { content, data } = matter(fileContents);
    
    return {
      props: {
        source: content,
        frontMatter: data,
      },
    };
  } catch (error) {
    console.error('Error reading file:', filePath, error);
    return {
      notFound: true,
    };
  }
} 