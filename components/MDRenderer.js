import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

const MDRenderer = ({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter
              style={materialDark}
              language={match[1]}
              PreTag="div"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
        // 이미지 경로 처리
        img({ node, ...props }) {
          return (
            <img
              {...props}
              className="max-w-full h-auto"
              loading="lazy"
            />
          );
        },
        // 테이블 스타일링
        table({ node, ...props }) {
          return (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200" {...props} />
            </div>
          );
        },
        th({ node, ...props }) {
          return (
            <th
              className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              {...props}
            />
          );
        },
        td({ node, ...props }) {
          return (
            <td
              className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
              {...props}
            />
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MDRenderer; 