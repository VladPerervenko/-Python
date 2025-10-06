import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { CodeInput } from './components/CodeInput';
import { ReviewOutput } from './components/ReviewOutput';
import { reviewCode } from './services/geminiService';
import { SUPPORTED_LANGUAGES } from './constants';
import { TrashIcon } from './components/icons/TrashIcon';

const LOCAL_STORAGE_KEY = 'codeReviewerSession_v2';

interface ReviewSession {
  id: string;
  code: string;
  language: string;
  review: string;
  suggestedCode: string | null;
  timestamp: number;
  originalFileName: string | null;
}

const HistoryIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </svg>
);

interface HistoryPanelProps {
  history: ReviewSession[];
  activeSessionId: string | null;
  onLoadSession: (id: string) => void;
  onClearHistory: () => void;
  languageLabelMap: Record<string, string>;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, activeSessionId, onLoadSession, onClearHistory, languageLabelMap }) => {
    const formatTimestamp = (timestamp: number) => {
        const now = Date.now();
        const seconds = Math.floor((now - timestamp) / 1000);
        if (seconds < 60) return `just now`;
        
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;

        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <div className="bg-gray-800 rounded-lg shadow-2xl p-6 flex flex-col h-[70vh] max-h-[800px]">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h2 className="text-xl font-semibold text-gray-100 flex items-center">
                    <HistoryIcon className="w-6 h-6 mr-2 text-purple-400" />
                    History
                </h2>
                {history.length > 0 && (
                    <button
                        onClick={onClearHistory}
                        aria-label="Clear history"
                        title="Clear all history"
                        className="p-2.5 text-gray-400 bg-gray-700 hover:bg-gray-600 hover:text-white rounded-lg transition-colors focus:ring-2 focus:ring-red-500 focus:outline-none"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                )}
            </div>
            <div className="overflow-y-auto flex-grow -mr-4 pr-3 space-y-2">
                {history.length === 0 ? (
                    <div className="text-center text-gray-500 pt-10">
                        <p>No reviews yet.</p>
                        <p className="text-sm">Your review history will appear here.</p>
                    </div>
                ) : (
                    history.map(session => (
                        <button
                            key={session.id}
                            onClick={() => onLoadSession(session.id)}
                            className={`w-full text-left p-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${activeSessionId === session.id ? 'bg-purple-900/50' : 'bg-gray-900 hover:bg-gray-700'}`}
                        >
                            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
                                <span>{languageLabelMap[session.language] || session.language}</span>
                                <span>{formatTimestamp(session.timestamp)}</span>
                            </div>
                            <p className="text-sm text-gray-200 font-mono truncate">
                                {session.code.split('\n')[0] || '[empty code]'}
                            </p>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
};

const App: React.FC = () => {
  const [code, setCode] = useState<string>('');
  const [language, setLanguage] = useState<string>(SUPPORTED_LANGUAGES[0].value);
  const [review, setReview] = useState<string | null>(null);
  const [suggestedCode, setSuggestedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string | null>(null);
  const [isSuggestionApplied, setIsSuggestionApplied] = useState<boolean>(false);
  const [history, setHistory] = useState<ReviewSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState) {
        const { current, history: savedHistory } = JSON.parse(savedState);
        if (current) {
          setCode(current.code || '');
          setLanguage(current.language || SUPPORTED_LANGUAGES[0].value);
          setReview(current.review || null);
          setSuggestedCode(current.suggestedCode || null);
          setOriginalFileName(current.originalFileName || null);
          setIsSuggestionApplied(current.isSuggestionApplied || false);
        }
        if (savedHistory) {
          setHistory(savedHistory);
        }
      }
    } catch (e) {
      console.error("Failed to load state from localStorage", e);
    }
  }, []);

  useEffect(() => {
    try {
      const stateToSave = {
        current: { code, language, review, suggestedCode, originalFileName, isSuggestionApplied },
        history,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error("Failed to save state to localStorage", e);
    }
  }, [code, language, review, suggestedCode, originalFileName, isSuggestionApplied, history]);

  const handleReview = useCallback(async () => {
    if (!code.trim()) {
      setError('Please enter some code to review.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setReview(null);
    setSuggestedCode(null);
    setIsSuggestionApplied(false);

    try {
      const { review: feedback, suggestedCode: newCode } = await reviewCode(code, language, originalFileName);
      setReview(feedback);
      if (newCode && newCode.trim() !== code.trim()) {
        setSuggestedCode(newCode);
      }
      
      const newSession: ReviewSession = {
        id: Date.now().toString(),
        code,
        language,
        review: feedback,
        suggestedCode: newCode,
        timestamp: Date.now(),
        originalFileName,
      };
      setHistory(prevHistory => [newSession, ...prevHistory]);
      setActiveSessionId(newSession.id);

    } catch (err) {
      if (err instanceof Error) {
        setError(`Failed to get review: ${err.message}. Please check your API key and try again.`);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [code, language, originalFileName]);

  const handleApplyChanges = useCallback(() => {
    if (suggestedCode) {
      setCode(suggestedCode);
      setSuggestedCode(null);
      setIsSuggestionApplied(true);
      setActiveSessionId(null);
    }
  }, [suggestedCode]);

  const handleClear = useCallback(() => {
    setCode('');
    setLanguage(SUPPORTED_LANGUAGES[0].value);
    setReview(null);
    setSuggestedCode(null);
    setError(null);
    setOriginalFileName(null);
    setIsSuggestionApplied(false);
    setActiveSessionId(null);
  }, []);
  
  const handleLoadSession = useCallback((sessionId: string) => {
    const session = history.find(s => s.id === sessionId);
    if (session) {
      setCode(session.code);
      setLanguage(session.language);
      setReview(session.review);
      setSuggestedCode(session.suggestedCode);
      setOriginalFileName(session.originalFileName);
      setIsSuggestionApplied(false);
      setError(null);
      setActiveSessionId(session.id);
    }
  }, [history]);

  const handleClearHistory = useCallback(() => {
    if (window.confirm('Are you sure you want to delete all review history? This cannot be undone.')) {
        setHistory([]);
    }
  }, []);

  const languageLabelMap = useMemo(() =>
    SUPPORTED_LANGUAGES.reduce((acc, lang) => {
        acc[lang.value] = lang.label;
        return acc;
    }, {} as Record<string, string>),
  []);


  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8 grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <div className="xl:col-span-3">
          <HistoryPanel
            history={history}
            activeSessionId={activeSessionId}
            onLoadSession={handleLoadSession}
            onClearHistory={handleClearHistory}
            languageLabelMap={languageLabelMap}
          />
        </div>
        <div className="xl:col-span-9 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <CodeInput
            code={code}
            setCode={setCode}
            language={language}
            setLanguage={setLanguage}
            onReview={handleReview}
            isLoading={isLoading}
            onClear={handleClear}
            setOriginalFileName={setOriginalFileName}
            setIsSuggestionApplied={setIsSuggestionApplied}
            setActiveSessionId={setActiveSessionId}
          />
          <ReviewOutput
            review={review}
            isLoading={isLoading}
            error={error}
            suggestedCode={suggestedCode}
            onApplyChanges={handleApplyChanges}
            originalCode={code}
            language={language}
            originalFileName={originalFileName}
            isSuggestionApplied={isSuggestionApplied}
          />
        </div>
      </main>
      <footer className="text-center p-4 text-gray-500 text-sm">
        <p>Powered by Google Gemini. Built for developers.</p>
      </footer>
    </div>
  );
};

export default App;