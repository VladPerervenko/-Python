import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { CodeInput } from './components/CodeInput';
import { ReviewOutput } from './components/ReviewOutput';
import { HistoryPanel } from './components/HistoryPanel';
import { reviewCode, detectLanguage, GeminiApiError, StructuredReview, ReviewPoint } from './services/geminiService';

export interface HistoryItem {
  id: string;
  code: string;
  language: string;
  review: StructuredReview;
  suggestedCode: string | null;
  timestamp: number;
}

const MAX_HISTORY_ITEMS = 50;

const App: React.FC = () => {
  const [code, setCode] = useState<string>('');
  const [language, setLanguage] = useState<string>('auto');
  const [review, setReview] = useState<StructuredReview | null>(null);
  const [suggestedCode, setSuggestedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<Record<number, string>>({});
  const [explanationLoading, setExplanationLoading] = useState<Record<number, boolean>>({});

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('reviewHistory');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error("Failed to parse history from localStorage", e);
      localStorage.removeItem('reviewHistory');
    }
  }, []);

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
    setExplanations({});
    setExplanationLoading({});
    setActiveHistoryId(null);

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

      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        code,
        language: languageToUse,
        review: feedback,
        suggestedCode: newCode,
        timestamp: Date.now(),
      };

      setHistory(prevHistory => {
        const updatedHistory = [newHistoryItem, ...prevHistory.filter(item => item.code !== code)].slice(0, MAX_HISTORY_ITEMS);
        localStorage.setItem('reviewHistory', JSON.stringify(updatedHistory));
        return updatedHistory;
      });
      setActiveHistoryId(newHistoryItem.id);

    } catch (err) {
      if (err instanceof GeminiApiError) {
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
      setActiveHistoryId(null);
    }
  }, [suggestedCode]);

  const handleExplainFurther = useCallback(async (pointIndex: number, point: ReviewPoint) => {
    setExplanationLoading(prev => ({ ...prev, [pointIndex]: true }));
    setError(null);

    try {
      const { explainFurther } = await import('./services/geminiService');
      const explanation = await explainFurther(code, language, point