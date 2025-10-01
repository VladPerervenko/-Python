import { GoogleGenAI, Type } from "@google/genai";
import { SUPPORTED_LANGUAGES } from "../constants";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export type ApiErrorType = 'API_KEY' | 'NETWORK' | 'RESPONSE_PARSING' | 'BAD_REQUEST' | 'UNKNOWN';

export class GeminiApiError extends Error {
  public type: ApiErrorType;

  constructor(message: string, type: ApiErrorType = 'UNKNOWN') {
    super(message);
    this.name = 'GeminiApiError';
    this.type = type;
  }
}

const handleApiError = (error: unknown): GeminiApiError => {
  console.error("Gemini API Error:", error);
  if (error instanceof GeminiApiError) {
      return error;
  }
  
  let message = "An unknown error occurred while communicating with the Gemini API.";
  let type: ApiErrorType = 'UNKNOWN';

  if (error instanceof Error) {
    if (error.message.includes('API key not valid')) {
      message = "Your API key is not valid. Please check your configuration.";
      type = 'API_KEY';
    } else if (error.message.toLowerCase().includes('network') || error.message.toLowerCase().includes('failed to fetch')) {
      message = "A network error occurred. Please check your internet connection and try again.";
      type = 'NETWORK';
    } else if (error.message.includes('400')) { // Bad Request
        message = "The API request failed (400 Bad Request). This can sometimes be caused by syntax errors or incomplete code in your input. Please review your code and try again.";
        type = 'BAD_REQUEST';
    } else {
      message = error.message;
    }
  }
  return new GeminiApiError(message, type);
};

export interface ReviewPoint {
  topic: string;
  feedback: string;
}

export interface StructuredReview {
  summary: string;
  points: ReviewPoint[];
}

export interface CodeReview {
  review: StructuredReview;
  suggestedCode: string | null;
}

export interface LanguageDetectionResult {
  language: string;
  confidence: 'high' | 'medium' | 'low';
}

export const detectLanguage = async (code: string): Promise<LanguageDetectionResult> => {
  const model = 'gemini-2.5-flash';
  
  const validLanguages = SUPPORTED_LANGUAGES
    .filter(lang => lang.value !== 'auto')
    .map(lang => `'${lang.value}'`)
    .join(', ');

  const prompt = `
    Identify the programming language of the following code snippet.
    Your response MUST be a JSON object with two keys: "language" and "confidence".

    - The "language" value must be one of the following exact strings: ${validLanguages}.
    - The "confidence" value must be one of these three strings: "high", "medium", or "low".
    - Use "low" confidence if you are very unsure, if the code is too short, or if it could be multiple languages.
    - If you cannot determine the language at all from the list, default to 'javascript' and 'low' confidence.

    Code snippet (first 2000 characters):
    ---
    ${code.substring(0, 2000)}
    ---
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
        language: {
            type: Type.STRING,
            description: `The detected programming language. Must be one of: ${validLanguages}`
        },
        confidence: {
            type: Type.STRING,
            description: `Confidence level of detection. Must be one of: "high", "medium", "low".`
        }
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const result: LanguageDetectionResult = JSON.parse(response.text);
    
    const isValid = SUPPORTED_LANGUAGES.some(l => l.value === result.language && l.value !== 'auto');
    if (isValid && ['high', 'medium', 'low'].includes(result.confidence)) {
      return result;
    }
    // Fallback if the model returns an invalid language string
    return { language: 'javascript', confidence: 'low' };

  } catch (error) {
    if (error instanceof SyntaxError) { // JSON.parse failed
        throw new GeminiApiError("Failed to parse the API response for language detection. The format might be incorrect.", 'RESPONSE_PARSING');
    }
    throw handleApiError(error);
  }
};


export const reviewCode = async (code: string, language: string): Promise<CodeReview> => {
  const model = 'gemini-2.5-flash';
  
  const prompt = `
    Как эксперт по ревью кода, пожалуйста, проанализируй следующий фрагмент кода на языке ${language}.
    Твой ответ ДОЛЖЕН быть в формате JSON, соответствующем предоставленной схеме.

    Для объекта "review":
    - "summary": Предоставь краткое, в одно-два предложения, общее резюме качества кода.
    - "points": Предоставь список конкретных пунктов обратной связи. Для каждого пункта:
      - "topic": Краткий заголовок для категории обратной связи (например, "Корректность", "Читаемость", "Производительность", "Безопасность", "Лучшие практики").
      - "feedback": Подробный, действенный отзыв по этому пункту в формате Markdown.

    Для поля "suggestedCode":
    - Если можно внести улучшения, верни полный, улучшенный фрагмент кода.
    - Если никаких изменений не требуется, верни null.
    - Убедись, что возвращаемый код является полным и может напрямую заменить оригинальный.

    Вот код:
    \`\`\`${language}
    ${code}
    \`\`\`
  `;
  
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
        review: {
            type: Type.OBJECT,
            properties: {
                summary: {
                    type: Type.STRING,
                    description: "A brief overall summary of the code review in Russian."
                },
                points: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            topic: {
                                type: Type.STRING,
                                description: "The topic of the feedback point in Russian (e.g., 'Корректность', 'Производительность')."
                            },
                            feedback: {
                                type: Type.STRING,
                                description: "Detailed feedback for this point in Markdown format, in Russian."
                            }
                        },
                        required: ["topic", "feedback"]
                    }
                }
            },
            required: ["summary", "points"]
        },
        suggestedCode: {
            type: Type.STRING,
            nullable: true,
            description: "The full code with suggested improvements, or null if no improvements are needed."
        }
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });
    
    const result: CodeReview = JSON.parse(response.text);
    return result;

  } catch (error) {
    if (error instanceof SyntaxError) {
        throw new GeminiApiError("Failed to parse the API response for code review. The format might be incorrect.", 'RESPONSE_PARSING');
    }
    throw handleApiError(error);
  }
};

export const explainFurther = async (code: string, language: string, point: ReviewPoint): Promise<string> => {
    const model = 'gemini-2.5-flash';

    const prompt = `
      An expert code review was performed on a snippet of ${language} code.
      A user has requested a more detailed explanation for a specific feedback point.

      Please elaborate on the feedback provided. Your explanation should be easy to understand for a developer.
      - Explain *why* this is an issue or a point of improvement.
      - Discuss the underlying concepts or principles.
      - If applicable, provide a small, focused "before" and "after" code example to illustrate the improvement.
      - Keep the tone helpful and educational.
      - Respond in Russian.

      **Original Code Snippet:**
      \`\`\`${language}
      ${code}
      \`\`\`

      **Feedback Point to Explain:**
      - **Topic:** ${point.topic}
      - **Feedback:** ${point.feedback}

      Provide your detailed explanation in Markdown format.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        throw handleApiError(error);
    }
};