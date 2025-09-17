import React, { useState, useCallback } from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';
import { SaveIcon } from './icons/SaveIcon';

interface ReviewOutputProps {
  review: string | null;
  isLoading: boolean;
  error: string | null;
  suggestedCode: string | null;
  onApplyChanges: () => void;
  originalFileName: string | null;
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

export const ReviewOutput: React.FC<ReviewOutputProps> = ({ review, isLoading, error, suggestedCode, onApplyChanges, originalFileName }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = useCallback(() => {
        if (review) {
            navigator.clipboard.writeText(review).then(() => {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        }
    }, [review]);

    const handleSaveReview = useCallback(() => {
        if (!review) return;
        
        let downloadName: string;
        if (originalFileName) {
            // Take the filename without extension
            const baseName = originalFileName.includes('.')
                ? originalFileName.split('.').slice(0, -1).join('.')
                : originalFileName;
            // Sanitize to prevent issues
            const sanitizedBaseName = baseName.replace(/[^a-z0-9_.-]/gi, '_');
            downloadName = `review_for_${sanitizedBaseName}.md`;
        } else {
            downloadName = `review_${Date.now()}.md`;
        }

        const blob = new Blob([review], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [review, originalFileName]);

    const handleSaveSuggestedCode = useCallback(() => {
        if (!suggestedCode || !originalFileName) return;

        let newFileName: string;
        const parts = originalFileName.split('.');
        if (parts.length === 1 || (parts[0] === '' && parts.length === 2)) {
            newFileName = `${originalFileName}_best`;
        } else {
            const extension = parts.pop();
            const baseName = parts.join('.');
            newFileName = `${baseName}_best.${extension}`;
        }

        const blob = new Blob([suggestedCode], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = newFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [suggestedCode, originalFileName]);

    return (
        <div className="bg-gray-800 rounded-lg shadow-2xl p-6 h-[70vh] max-h-[800px] flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h2 className="text-xl font-semibold text-gray-100">Feedback</h2>
                {review && !isLoading && !error && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSaveReview}
                            className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500"
                            aria-label="Save review to a file"
                        >
                            <SaveIcon className="w-4 h-4 mr-1.5" />
                            Сохранить рецензию
                        </button>
                        <button
                            onClick={handleCopy}
                            className={`inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md transition-colors ${
                                isCopied
                                    ? 'text-green-900 bg-green-300'
                                    : 'text-gray-300 bg-gray-700 hover:bg-gray-600'
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500`}
                            aria-label={isCopied ? 'Copied to clipboard' : 'Copy review to clipboard'}
                            disabled={isCopied}
                        >
                            {isCopied ? (
                                <CheckIcon className="w-4 h-4 mr-1.5" />
                            ) : (
                                <ClipboardIcon className="w-4 h-4 mr-1.5" />
                            )}
                            {isCopied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                )}
            </div>
            <div className="bg-gray-900 rounded-md p-4 overflow-y-auto flex-grow prose prose-invert max-w-none prose-pre:bg-gray-800 prose-pre:p-4 prose-pre:rounded-md">
                {isLoading && <LoadingSkeleton />}
                {error && <div className="text-red-400 bg-red-900/50 p-4 rounded-md border border-red-700">{error}</div>}
                {!isLoading && !error && review && <div className="whitespace-pre-wrap font-sans text-gray-300" dangerouslySetInnerHTML={{ __html: review.replace(/```(\w*)\n([\s\S]*?)\n```/g, '<pre><code>$2</code></pre>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />}
                {!isLoading && !error && !review && <WelcomeMessage />}
            </div>
            {suggestedCode && !isLoading && !error && (
                <div className="mt-4 pt-4 border-t border-gray-700 flex-shrink-0">
                    <p className="text-sm text-center text-gray-400 mb-2">Gemini предложил улучшения. Хотите применить их?</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                            onClick={onApplyChanges}
                            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 transition-colors"
                        >
                            <SparklesIcon className="w-5 h-5 mr-2" />
                            Применить изменения
                        </button>
                         <button
                            onClick={handleSaveSuggestedCode}
                            disabled={!originalFileName}
                            className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={!originalFileName ? "Загрузите файл, чтобы включить эту функцию" : "Сохранить предложенный код в новый файл"}
                        >
                            <SaveIcon className="w-5 h-5 mr-2" />
                            Сохранить изменения
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};