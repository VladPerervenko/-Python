import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { CodeInput } from './components/CodeInput';
import { ReviewOutput } from './components/ReviewOutput';
import { reviewCode, detectLanguage, GeminiApiError } from './services/geminiService';

const App: React.FC = () => {
  const [code, setCode] = useState<string>('');
  const [language, setLanguage] = useState<string>('auto');
  const [review, setReview] = useState<string | null>(null);
  const [suggestedCode, setSuggestedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string | null>(null);

  const handleReview = useCallback(async () => {
    if (!code.trim()) {
      setError('Please enter some code to review.');
      return;
    }
    setIsLoading(true);
    setLoadingMessage('');
    setError(null);
    setReview(null);
    setSuggestedCode(null);

    try {
      let languageToUse = language;
      if (language === 'auto') {
        setLoadingMessage('Detecting language...');
        const detectionResult = await detectLanguage(code);

        if (detectionResult.confidence === 'low') {
          setError('Could not confidently detect the language. Please select it manually and try again.');
          setIsLoading(false);
          setLoadingMessage('');
          return;
        }

        const detectedLanguage = detectionResult.language;
        setLanguage(detectedLanguage);
        languageToUse = detectedLanguage;
      }

      setLoadingMessage('Reviewing code...');
      const { review: feedback, suggestedCode: newCode } = await reviewCode(code, languageToUse);
      setReview(feedback);
      if (newCode && newCode.trim() !== code.trim()) {
        setSuggestedCode(newCode);
      }
    } catch (err) {
      if (err instanceof GeminiApiError) {
        // The custom error from the service already has a user-friendly message.
        setError(err.message);
      } else if (err instanceof Error) {
        setError(`An unexpected application error occurred: ${err.message}`);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
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
          loadingMessage={loadingMessage}
          setOriginalFileName={setOriginalFileName}
        />
        <ReviewOutput
          review={review}
          isLoading={isLoading}
          error={error}
          suggestedCode={suggestedCode}
          onApplyChanges={handleApplyChanges}
          originalFileName={originalFileName}
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