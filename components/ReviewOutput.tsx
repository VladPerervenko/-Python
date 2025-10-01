import React, { useState, useCallback } from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';
import { SaveIcon } from './icons/SaveIcon';
import { InfoIcon } from './icons/InfoIcon';
import type { StructuredReview, ReviewPoint } from '../services/geminiService';

interface ReviewOutputProps {
  review: StructuredReview | null;
  isLoading: boolean;
  error: string | null;
  suggestedCode: string | null;
  onApplyChanges: () => void;
  originalFileName: string | null;
  onExplainFurther: (pointIndex: number, point: ReviewPoint) => void;
  explanations: Record<number, string>;
  explanationLoading: Record<number, boolean>;
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
);

const SimpleMarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    if (!content) return null;

    const parts = content.split(/(```[\s\S]*?```)/g).filter(Boolean);

    return (
        <>
            {parts.map((part, index) => {
                if (part.startsWith('```')) {
                    const codeContent = part.replace(/```(\w*\n)?/g, '').replace(/```$/, '');
                    return (
                        <pre key={index} className="bg-gray-800 p-4 rounded-md my-2 overflow-x-auto">
                            <code className="font-mono text-sm">{codeContent}</code>
                        </pre>
                    );
                } else {
                    const textParts = part.split(/(`[^`]+`|\*\*.*?\*\*)/g).filter(Boolean);
                    return (
                        <span key={index}>
                            {textParts.map((textPart, textIndex) => {
                                if (textPart.startsWith('`') && textPart.endsWith('`')) {
                                    return <code key={textIndex} className="bg-gray-700 text-purple-300 rounded-md px-1.5 py-0.5 font-mono text-sm">{textPart.slice(1, -1)}</code>;
                                }
                                if (textPart.startsWith('**') && textPart.endsWith('**')) {
                                    return <strong key={textIndex}>{textPart.slice(2, -2)}</strong>;
                                }
                                return <React.Fragment key={textIndex}>{textPart}</React.Fragment>;
                            })}
                        </span>
                    );
                }
            })}
        </>
    );
};

export const ReviewOutput: React.FC<ReviewOutputProps> = ({ review, isLoading, error, suggestedCode, onApplyChanges, originalFileName, onExplainFurther, explanations, explanationLoading }) => {
    const [isCopied, setIsCopied] = useState(false);

    const formatReviewForExport = useCallback((reviewToFormat: StructuredReview | null): string => {
        if (!reviewToFormat) return "";

        let markdownString = `# Code Review Summary\n\n`;
        markdownString += `${reviewToFormat.summary}\n\n`;
        markdownString += `## Feedback Points\n\n`;

        reviewToFormat.points.forEach((point, index) => {
            markdownString += `### ${index + 1}. ${point.topic}\n\n`;
            markdownString += `${point.feedback}\n\n`;
        });

        return markdownString;
    }, []);

    const handleCopy = useCallback(() => {
        const reviewText = formatReviewForExport(review);
        if (reviewText) {
            navigator.clipboard.writeText(reviewText).then(() => {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        }
    }, [review, formatReviewForExport]);

    const handleSaveReview = useCallback(() => {
        const reviewText = formatReviewForExport(review);
        if (!reviewText) return;
        
        let downloadName: string;
        if (originalFileName) {
            const baseName = originalFileName.includes('.')
                ? originalFileName.split('.').slice(0, -1).join('.')
                : originalFileName;
            const sanitizedBaseName = baseName.replace(/[^a-z0-9_.-]/gi, '_');
            downloadName = `review_for_${sanitizedBaseName}.md`;
        } else {
            downloadName = `review_${Date.now()}.md`;
        }

        const blob = new Blob([reviewText], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [review, originalFileName, formatReviewForExport]);

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
            <div className="bg-gray-900 rounded-md p-4 overflow-y-auto flex-grow">
                {isLoading && <LoadingSkeleton />}
                {error && <div className="text-red-400 bg-red-900/50 p-4 rounded-md border border-red-700">{error}</div>}
                {!isLoading && !error && review && (
                    <div className="font-sans text-gray-300">
                        <p className="mb-6 italic">{review.summary}</p>
                        <ul className="space-y-6 list-none p-0">
                            {review.points.map((point, index) => (
                                <li key={index} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                                    <div className="flex justify-between items-start gap-2">
                                        <h4 className="font-semibold text-purple-400 mb-2 text-lg">{point.topic}</h4>
                                        <button 
                                            onClick={() => onExplainFurther(index, point)}
                                            disabled={explanationLoading[index]}
                                            className="flex-shrink-0 ml-4 inline-flex items-center justify-center px-3 py-1 text-xs font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 transition-colors disabled:opacity-50 disabled:cursor-wait"
                                        >
                                            {explanationLoading[index] ? (
                                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : (
                                                <>
                                                    <InfoIcon className="w-4 h-4 mr-1.5" />
                                                    Explain
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <div className="whitespace-pre-wrap">
                                      <SimpleMarkdownRenderer content={point.feedback} />
                                    </div>
                                    {explanations[index] && (
                                        <div className="mt-4 pt-4 border-t border-gray-700/50 bg-gray-900/50 p-3 rounded-md">
                                            <h5 className="text-sm font-semibold text-gray-400 mb-2">Further Explanation:</h5>
                                            <div className="whitespace-pre-wrap text-sm">
                                                <SimpleMarkdownRenderer content={explanations[index]} />
                                            </div>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
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
