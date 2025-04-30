import { useState } from 'react';
import Link from 'next/link';

const FileTree = ({ items }) => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <TreeNode items={items} level={0} />
    </div>
  );
};

const TreeNode = ({ items, level }) => {
  const [expandedFolders, setExpandedFolders] = useState({});

  const toggleFolder = (path) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  return (
    <div className={`pl-${level > 0 ? '4' : '0'}`}>
      {items.map((item) => (
        <div key={item.path} className="my-1">
          {item.type === 'directory' ? (
            <div>
              <button
                onClick={() => toggleFolder(item.path)}
                className="flex items-center space-x-2 hover:bg-gray-100 rounded px-2 py-1 w-full text-left"
              >
                <span className="w-4">
                  {expandedFolders[item.path] ? '▼' : '▶'}
                </span>
                <span className="font-medium">{item.name}</span>
              </button>
              {expandedFolders[item.path] && (
                <TreeNode items={item.children} level={level + 1} />
              )}
            </div>
          ) : (
            item.name.startsWith('reading-cycle') && (
              <Link href={`/books/${item.path.replace(/\.md$/, '')}`}>
                <div className="flex items-center space-x-2 pl-6 hover:bg-gray-100 rounded px-2 py-1 cursor-pointer">
                  <span className="w-4">📄</span>
                  <span>{item.name}</span>
                </div>
              </Link>
            )
          )}
        </div>
      ))}
    </div>
  );
};

export default FileTree; 