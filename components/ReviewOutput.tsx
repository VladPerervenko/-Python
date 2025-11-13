import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { SaveIcon } from './icons/SaveIcon';

interface ReviewOutputProps {
  review: string | null;
  isLoading: boolean;
  error: string | null;
  suggestedCode: string | null;
  onApplyChanges: () => void;
  originalCode: string;
  language: string;
  originalFileName: string | null;
  isSuggestionApplied: boolean;
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

export const ReviewOutput: React.FC<ReviewOutputProps> = ({ review, isLoading, error, suggestedCode, onApplyChanges, originalCode, language, originalFileName, isSuggestionApplied }) => {
    
    const handleSaveReview = () => {
        if (!review) return;

        let markdownContent = `# Code Review\n\n`;
        markdownContent += `## Original Code (${language})\n\n`;
        markdownContent += `\`\`\`${language}\n${originalCode}\n\`\`\`\n\n`;
        markdownContent += `---\n\n`;
        markdownContent += `## Review Feedback\n\n`;
        markdownContent += `${review}\n\n`;

        if (suggestedCode) {
            markdownContent += `---\n\n`;
            markdownContent += `## Suggested Code\n\n`;
            markdownContent += `\`\`\`${language}\n${suggestedCode}\n\`\`\`\n`;
        }
        
        const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'code-review.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const saveCodeToFile = (codeToSave: string) => {
        if (!codeToSave) return;

        const langExtMap: { [key: string]: string } = {
            javascript: 'js',
            typescript: 'ts',
            python: 'py',
            java: 'java',
            csharp: 'cs',
            go: 'go',
            rust: 'rs',
            r: 'r',
            html: 'html',
            css: 'css',
            sql: 'sql',
            json: 'json',
        };

        let filename = `code_best.${langExtMap[language] || 'txt'}`;

        if (originalFileName) {
            const parts = originalFileName.split('.');
            if (parts.length > 1) {
                const ext = parts.pop();
                const base = parts.join('.');
                filename = `${base}_best.${ext}`;
            } else {
                filename = `${originalFileName}_best`;
            }
        }
        
        const blob = new Blob([codeToSave], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const showSuggestionActions = (suggestedCode || isSuggestionApplied) && !isLoading && !error;

    return (
    <div className="bg-gray-800 rounded-lg shadow-2xl p-6 h-[70vh] max-h-[800px] flex flex-col">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-100">Feedback</h2>
            {review && !isLoading && !error && (
                <button
                    onClick={handleSaveReview}
                    aria-label="Save review"
                    title="Save review as Markdown"
                    className="p-2.5 text-gray-400 bg-gray-700 hover:bg-gray-600 hover:text-white rounded-lg transition-colors focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                    <DownloadIcon className="w-5 h-5" />
                </button>
            )}
        </div>
        <div className="bg-gray-900 rounded-md p-4 overflow-y-auto flex-grow prose prose-invert max-w-none prose-pre:bg-gray-800 prose-pre:p-4 prose-pre:rounded-md">
            {isLoading && <LoadingSkeleton />}
            {error && <div className="text-red-400 bg-red-900/50 p-4 rounded-md border border-red-700">{error}</div>}
            {!isLoading && !error && review && <div className="whitespace-pre-wrap font-sans text-gray-300" dangerouslySetInnerHTML={{ __html: review.replace(/```(\w*)\n([\s\S]*?)\n```/g, '<pre><code>$2</code></pre>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />}
            {!isLoading && !error && !review && <WelcomeMessage />}
        </div>
        {showSuggestionActions && (
            <div className="mt-4 pt-4 border-t border-gray-700 flex-shrink-0">
                {suggestedCode ? (
                    <>
                        <p className="text-sm text-center text-gray-400 mb-2">Gemini предложил улучшения.</p>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <button
                                onClick={onApplyChanges}
                                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 transition-colors"
                            >
                                <SparklesIcon className="w-5 h-5 mr-2" />
                                Применить изменения
                            </button>
                            <button
                                onClick={() => saveCodeToFile(suggestedCode)}
                                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 transition-colors"
                                title="Сохранить исправленный код в файл"
                            >
                                <SaveIcon className="w-5 h-5 mr-2" />
                                Сохранить исправленный код
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <p className="text-sm text-center text-gray-400 mb-2">Изменения применены. Вы можете сохранить исправленный код.</p>
                        <div className="flex">
                            <button
                                onClick={() => saveCodeToFile(originalCode)}
                                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 transition-colors"
                                title="Сохранить исправленный код в файл"
                            >
                                <SaveIcon className="w-5 h-5 mr-2" />
                                Сохранить исправленный код
                            </button>
                        </div>
                    </>
                )}
            </div>
        )}
    </div>
  );
};