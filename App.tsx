import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { CodeInput } from './components/CodeInput';
import { ReviewOutput } from './components/ReviewOutput';
import { reviewCode } from './services/geminiService';
import { SUPPORTED_LANGUAGES } from './constants';

const LOCAL_STORAGE_KEY = 'codeReviewerSession';

const App: React.FC = () => {
  const [code, setCode] = useState<string>('');
  const [language, setLanguage] = useState<string>(SUPPORTED_LANGUAGES[0].value);
  const [review, setReview] = useState<string | null>(null);
  const [suggestedCode, setSuggestedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState) {
        const { code, language, review, suggestedCode, originalFileName } = JSON.parse(savedState);
        if (code) setCode(code);
        if (language) setLanguage(language);
        if (review) setReview(review);
        if (suggestedCode) setSuggestedCode(suggestedCode);
        if (originalFileName) setOriginalFileName(originalFileName);
      }
    } catch (e) {
      console.error("Failed to load state from localStorage", e);
    }
  }, []);

  useEffect(() => {
    try {
      const stateToSave = JSON.stringify({ code, language, review, suggestedCode, originalFileName });
      localStorage.setItem(LOCAL_STORAGE_KEY, stateToSave);
    } catch (e) {
      console.error("Failed to save state to localStorage", e);
    }
  }, [code, language, review, suggestedCode, originalFileName]);

  const handleReview = useCallback(async () => {
    if (!code.trim()) {
      setError('Please enter some code to review.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setReview(null);
    setSuggestedCode(null);

    try {
      const { review: feedback, suggestedCode: newCode } = await reviewCode(code, language);
      setReview(feedback);
      if (newCode && newCode.trim() !== code.trim()) {
        setSuggestedCode(newCode);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(`Failed to get review: ${err.message}. Please check your API key and try again.`);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [code, language]);

  const handleApplyChanges = useCallback(() => {
    if (suggestedCode) {
      setCode(suggestedCode);
      setSuggestedCode(null);
    }
  }, [suggestedCode]);

  const handleClear = useCallback(() => {
    setCode('');
    setLanguage(SUPPORTED_LANGUAGES[0].value);
    setReview(null);
    setSuggestedCode(null);
    setError(null);
    setOriginalFileName(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <CodeInput
          code={code}
          setCode={setCode}
          language={language}
          setLanguage={setLanguage}
          onReview={handleReview}
          isLoading={isLoading}
          onClear={handleClear}
          setOriginalFileName={setOriginalFileName}
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
        />
      </main>
      <footer className="text-center p-4 text-gray-500 text-sm">
        <p>Powered by Google Gemini. Built for developers.</p>
      </footer>
    </div>
  );
};

export default App;