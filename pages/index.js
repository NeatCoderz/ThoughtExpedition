import fs from 'fs';
import path from 'path';
import FileTree from '../components/FileTree';

export default function Home({ fileStructure }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Thought Expedition</h1>
      <FileTree items={fileStructure} />
    </div>
  );
}

function getFileStructure(dir, basePath = '') {
  const items = fs.readdirSync(dir);
  
  return items.map(item => {
    const fullPath = path.join(dir, item);
    const relativePath = path.join(basePath, item);
    const stats = fs.statSync(fullPath);
    
    if (stats.isDirectory()) {
      return {
        type: 'directory',
        name: item,
        path: relativePath,
        children: getFileStructure(fullPath, relativePath)
      };
    }
    
    return {
      type: 'file',
      name: item,
      path: relativePath
    };
  });
}

export async function getStaticProps() {
  const booksDirectory = path.join(process.cwd(), 'books');
  const fileStructure = getFileStructure(booksDirectory);

  return {
    props: {
      fileStructure,
    },
  };
} 