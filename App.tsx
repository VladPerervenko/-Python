import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { CodeInput } from './components/CodeInput';
import { ReviewOutput } from './components/ReviewOutput';
import { reviewCode } from './services/geminiService';
import { SUPPORTED_LANGUAGES } from './constants';

const App: React.FC = () => {
  const [code, setCode] = useState<string>('');
  const [language, setLanguage] = useState<string>(SUPPORTED_LANGUAGES[0].value);
  const [review, setReview] = useState<string | null>(null);
  const [suggestedCode, setSuggestedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
        />
        <ReviewOutput
          review={review}
          isLoading={isLoading}
          error={error}
          suggestedCode={suggestedCode}
          onApplyChanges={handleApplyChanges}
        />
      </main>
      <footer className="text-center p-4 text-gray-500 text-sm">
        <p>Powered by Google Gemini. Built for developers.</p>
        <p className="mt-1">Crafted with ❤️ by your AI assistant.</p>
      </footer>
    </div>
  );
};

export default App;