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
    let currentAuthor = null;
    
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('<@ @')) {
        // 새로운 카드 시작
        currentCard = {
          author: line.replace('<@ @', '').trim(),
          content: '',
          comments: []
        };
        cards.push(currentCard);
      } else if (line === '@>') {
        // 카드 종료
        currentCard = null;
      } else if (line === '<#') {
        // 본문 시작
        currentSection = 'content';
      } else if (line === '#>') {
        // 본문 종료
        currentSection = null;
      } else if (line.startsWith('<## @')) {
        // 댓글 시작
        if (currentCard) {
          currentComment = {
            author: line.replace('<## @', '').trim(),
            content: ''
          };
          currentCard.comments.push(currentComment);
          currentSection = 'comment';
        }
      } else if (line === '##>') {
        // 댓글 종료
        currentSection = null;
        currentComment = null;
      } else if (currentCard && currentSection) {
        // 내용 추가
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
        <div key={index} className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">
              {card.author?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="ml-3">
              <div className="text-white font-medium">{card.author || 'Unknown'}</div>
            </div>
          </div>
          
          <div className="prose prose-invert max-w-none mb-6">
            {renderMarkdown(card.content)}
          </div>
          
          {card.comments?.length > 0 && (
            <div className="mt-6 space-y-4">
              {card.comments.map((comment, commentIndex) => (
                <div key={commentIndex} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-bold">
                      {comment.author?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="ml-2">
                      <div className="text-white text-sm font-medium">{comment.author || 'Unknown'}</div>
                    </div>
                  </div>
                  <div className="prose prose-invert max-w-none text-sm">
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