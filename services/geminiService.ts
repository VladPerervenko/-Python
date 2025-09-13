import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export interface CodeReview {
  review: string;
  suggestedCode: string | null;
}

export const reviewCode = async (code: string, language: string): Promise<CodeReview> => {
  const model = 'gemini-2.5-flash';
  
  const prompt = `
    Как эксперт по ревью кода, пожалуйста, проанализируй следующий фрагмент кода на языке ${language}.

    Твой ответ ДОЛЖЕН быть в формате JSON, соответствующем предоставленной схеме.

    Сосредоточься на следующих областях для своего отзыва в поле "review":
    1.  **Корректность и ошибки:** Определи любые логические ошибки, потенциальные баги или крайние случаи, которые не обрабатываются.
    2.  **Лучшие практики и читаемость:** Соответствует ли код установленным лучшим практикам и соглашениям для языка ${language}? Является ли он ясным, кратким и поддерживаемым?
    3.  **Производительность:** Укажи на любые потенциальные узкие места в производительности или предложи более эффективные подходы.
    4.  **Безопасность:** Выдели любые очевидные уязвимости безопасности.
    5.  **Предложения по улучшению:** Предложи конкретные, действенные предложения.

    В поле "suggestedCode" верни полный фрагмент кода с примененными улучшениями.
    - Если никаких изменений не требуется, верни null для поля "suggestedCode".
    - Убедись, что возвращаемый код является полным и может напрямую заменить оригинальный.

    Вот код:
    \`\`\`${language}
    ${code}
    \`\`\`

    Предоставь свой отзыв в поле "review" в формате Markdown на русском языке.
  `;
  
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
        review: {
            type: Type.STRING,
            description: "Подробный отзыв о коде в формате Markdown на русском языке."
        },
        suggestedCode: {
            type: Type.STRING,
            nullable: true,
            description: "Полный код с предложенными улучшениями или null, если улучшения не нужны."
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
    
    // The response text should be a valid JSON string matching the schema
    const result: CodeReview = JSON.parse(response.text);
    return result;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API request failed: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the Gemini API.");
  }
};