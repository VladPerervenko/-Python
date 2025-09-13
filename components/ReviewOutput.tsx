import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';

interface ReviewOutputProps {
  review: string | null;
  isLoading: boolean;
  error: string | null;
  suggestedCode: string | null;
  onApplyChanges: () => void;
}

const LoadingSkeleton: React.FC = () => (
    <div className="space-y-5 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-1/4"></div>
        <div className="space-y-3">
            <div className="h-3 bg-gray-700 rounded w-full"></div>
            <div className="h-3 bg-gray-700 rounded w-5/6"></div>
            <div className="h-3 bg-gray-700 rounded w-full"></div>
        </div>
        <div className="h-4 bg-gray-700 rounded w-1/3 mt-6"></div>
        <div className="space-y-3">
            <div className="h-3 bg-gray-700 rounded w-full"></div>
            <div className="h-3 bg-gray-700 rounded w-4/6"></div>
        </div>
    </div>
);

const WelcomeMessage: React.FC = () => (
    <div className="text-center text-gray-400 flex flex-col items-center justify-center h-full">
        <SparklesIcon className="w-16 h-16 text-purple-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-200">AI Code Review Feedback</h3>
        <p className="mt-1">Your code analysis will appear here.</p>
        <p className="text-sm text-gray-500 mt-2">Enter your code and click "Review Code" to begin.</p>
    </div>
)

export const ReviewOutput: React.FC<ReviewOutputProps> = ({ review, isLoading, error, suggestedCode, onApplyChanges }) => {
  return (
    <div className="bg-gray-800 rounded-lg shadow-2xl p-6 h-[70vh] max-h-[800px] flex flex-col">
        <h2 className="text-xl font-semibold text-gray-100 mb-4 flex-shrink-0">Feedback</h2>
        <div className="bg-gray-900 rounded-md p-4 overflow-y-auto flex-grow prose prose-invert max-w-none prose-pre:bg-gray-800 prose-pre:p-4 prose-pre:rounded-md">
            {isLoading && <LoadingSkeleton />}
            {error && <div className="text-red-400 bg-red-900/50 p-4 rounded-md border border-red-700">{error}</div>}
            {!isLoading && !error && review && <div className="whitespace-pre-wrap font-sans text-gray-300" dangerouslySetInnerHTML={{ __html: review.replace(/```(\w*)\n([\s\S]*?)\n```/g, '<pre><code>$2</code></pre>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />}
            {!isLoading && !error && !review && <WelcomeMessage />}
        </div>
        {suggestedCode && !isLoading && !error && (
            <div className="mt-4 pt-4 border-t border-gray-700 flex-shrink-0">
                <p className="text-sm text-center text-gray-400 mb-2">Gemini предложил улучшения. Хотите применить их?</p>
                <button
                    onClick={onApplyChanges}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 transition-colors"
                >
                    <SparklesIcon className="w-5 h-5 mr-2" />
                    Применить изменения
                </button>
            </div>
        )}
    </div>
  );
};