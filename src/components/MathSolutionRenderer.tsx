
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MathSolutionRendererProps {
  content: string;
}

const MathSolutionRenderer: React.FC<MathSolutionRendererProps> = ({ content }) => {
  return (
    <div className="math-renderer prose prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[[rehypeKatex, { 
          strict: false, 
          throwOnError: false,
          trust: true,
          output: 'htmlAndMathml'
        }]]}
        components={{
          h3: ({ node, ...props }) => <h3 className="text-indigo-400 font-bold border-l-4 border-indigo-600 pl-4 my-6 uppercase text-sm tracking-widest" {...props} />,
          p: ({ node, ...props }) => <p className="text-slate-300 math-text text-lg leading-relaxed" {...props} />,
          strong: ({ node, ...props }) => <strong className="text-white font-bold" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-2 text-slate-300 my-4" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-4 my-6 text-slate-300" {...props} />,
          li: ({ node, ...props }) => <li className="math-text" {...props} />,
          code: ({ node, ...props }) => <code className="bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded text-xs font-mono" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MathSolutionRenderer;
