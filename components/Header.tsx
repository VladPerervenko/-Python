import React from 'react';
import { CodeIcon } from './icons/CodeIcon';

export const Header: React.FC = () => {
  return (
    <header className="w-full bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex items-center justify-center">
        <CodeIcon className="w-8 h-8 text-purple-400 mr-3" />
        <h1 className="text-2xl font-bold text-gray-100 tracking-tight">
          Gemini Code Reviewer
        </h1>
      </div>
    </header>
  );
};
