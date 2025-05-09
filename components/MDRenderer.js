import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

const MDRenderer = ({ content }) => {
  const parseContent = (text) => {
    if (!text) return [];
    
    const cards = [];
    let currentCard = null;
    let currentSection = null;
    let currentComment = null;
    
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.trim().startsWith('<@ @')) {
        currentCard = {
          author: line.trim().replace('<@ @', '').trim(),
          content: '',
          comments: []
        };
        cards.push(currentCard);
      } else if (line.trim() === '@>') {
        currentCard = null;
      } else if (line.trim() === '<#') {
        currentSection = 'content';
      } else if (line.trim() === '#>') {
        currentSection = null;
      } else if (line.trim().startsWith('<## @')) {
        if (currentCard) {
          currentComment = {
            author: line.trim().replace('<## @', '').trim(),
            content: ''
          };
          currentCard.comments.push(currentComment);
          currentSection = 'comment';
        }
      } else if (line.trim() === '##>') {
        currentSection = null;
        currentComment = null;
      } else if (currentCard && currentSection) {
        if (currentSection === 'content') {
          currentCard.content += line + '\n';
        } else if (currentSection === 'comment' && currentComment) {
          currentComment.content += line + '\n';
        }
      }
    }
    
    return cards;
  };

  const cards = parseContent(content);

  const renderMarkdown = (text) => {
    if (!text) return null;
    
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={vscDarkPlus}
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
          ul({ node, children, ...props }) {
            let depth = 0;
            let parent = node.parent;
            while (parent) {
              if (parent.type === 'list') depth++;
              parent = parent.parent;
            }
            
            return (
              <ul className={`list-disc pl-${depth * 4} my-1`} {...props}>
                {children}
              </ul>
            );
          },
          li({ node, children, ...props }) {
            return (
              <li className="my-0.5" {...props}>
                {children}
              </li>
            );
          }
        }}
      >
        {text}
      </ReactMarkdown>
    );
  };

  if (!cards.length) {
    return <div className="text-gray-400">콘텐츠가 없습니다.</div>;
  }

  return (
    <div className="space-y-8">
      {cards.map((card, index) => (
        <div key={index} className={`rounded-lg p-6 shadow-lg ${
          card.author === 'SUMMARY' 
            ? 'bg-indigo-950 border border-indigo-800' 
            : 'bg-gray-800'
        }`}>
          <div className="flex items-center mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
              card.author === 'SUMMARY'
                ? 'bg-indigo-900'
                : 'bg-gray-700'
            }`}>
              {card.author?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="ml-3">
              <div className={`font-medium ${
                card.author === 'SUMMARY'
                  ? 'text-indigo-200'
                  : 'text-white'
              }`}>{card.author || 'Unknown'}</div>
            </div>
          </div>
          
          <div className="prose prose-invert max-w-none mb-6 leading-relaxed">
            {renderMarkdown(card.content)}
          </div>
          
          {card.comments?.length > 0 && (
            <div className="mt-6 space-y-4">
              {card.comments.map((comment, commentIndex) => (
                <div key={commentIndex} className={`rounded-lg p-4 ${
                  card.author === 'SUMMARY'
                    ? 'bg-indigo-900'
                    : 'bg-gray-700'
                }`}>
                  <div className="flex items-center mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      card.author === 'SUMMARY'
                        ? 'bg-indigo-800'
                        : 'bg-gray-600'
                    }`}>
                      {comment.author?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="ml-2">
                      <div className={`text-sm font-medium ${
                        card.author === 'SUMMARY'
                          ? 'text-indigo-200'
                          : 'text-white'
                      }`}>{comment.author || 'Unknown'}</div>
                    </div>
                  </div>
                  <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                    {renderMarkdown(comment.content)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MDRenderer; 