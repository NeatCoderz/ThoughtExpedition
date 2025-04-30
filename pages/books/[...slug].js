import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import { serialize } from 'next-mdx-remote/serialize';
import { MDXRemote } from 'next-mdx-remote';

export default function Book({ source, data, filePath }) {
  const pathParts = filePath.split('/');
  
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
      <div className="mb-4">
        <div className="text-gray-600">
          {pathParts.slice(0, -1).join(' / ')}
        </div>
      </div>
      <h1 className="text-4xl font-bold mb-8">{data.title || pathParts[pathParts.length - 1]}</h1>
      <div className="prose prose-lg max-w-none">
        <MDXRemote {...source} />
      </div>
    </div>
  );
}

function getAllFilePaths(dir, fileList = [], basePath = '') {
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const relativePath = path.join(basePath, item);
    const stats = fs.statSync(fullPath);
    
    if (stats.isDirectory()) {
      getAllFilePaths(fullPath, fileList, relativePath);
    } else if (item.endsWith('.md') || item.endsWith('.mdx')) {
      // 파일 경로를 URL 친화적인 형식으로 변환
      const urlPath = relativePath.replace(/\\/g, '/');
      fileList.push(urlPath);
    }
  });
  
  return fileList;
}

export async function getStaticPaths() {
  const booksDirectory = path.join(process.cwd(), 'books');
  const filePaths = getAllFilePaths(booksDirectory);
  
  // 각 파일 경로를 slug 배열로 변환
  const paths = filePaths.map(filePath => {
    const slug = filePath.split('/');
    return {
      params: { slug }
    };
  });

  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const { slug } = params;
  const filePath = slug.join('/');
  const fullPath = path.join(process.cwd(), 'books', filePath);
  
  try {
    const fileContent = fs.readFileSync(fullPath, 'utf8');
    const { content, data } = matter(fileContent);
    
    const mdxSource = await serialize(content, {
      mdxOptions: {
        development: process.env.NODE_ENV === 'development',
      },
    });

    return {
      props: {
        source: mdxSource,
        data: data || {},
        filePath,
      },
    };
  } catch (error) {
    console.error('Error reading file:', error);
    return {
      notFound: true,
    };
  }
} 