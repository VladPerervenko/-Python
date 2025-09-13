import React from 'react';
import { SUPPORTED_LANGUAGES } from '../constants';
import { SparklesIcon } from './icons/SparklesIcon';

interface CodeInputProps {
  code: string;
  setCode: (code: string) => void;
  language: string;
  setLanguage: (language: string) => void;
  onReview: () => void;
  isLoading: boolean;
}

export const CodeInput: React.FC<CodeInputProps> = ({ code, setCode, language, setLanguage, onReview, isLoading }) => {
  return (
    <div className="bg-gray-800 rounded-lg shadow-2xl p-6 flex flex-col h-[70vh] max-h-[800px]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-100">Your Code</h2>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-auto p-2.5"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Paste your code snippet here..."
        className="flex-grow bg-gray-900 border border-gray-700 rounded-md p-4 font-mono text-sm w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none transition-shadow"
        spellCheck="false"
      />
      <button
        onClick={onReview}
        disabled={isLoading}
        className="mt-4 w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 transition-colors"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Reviewing...
          </>
        ) : (
          <>
            <SparklesIcon className="w-5 h-5 mr-2" />
            Review Code
          </>
        )}
      </button>
    </div>
  );
};
