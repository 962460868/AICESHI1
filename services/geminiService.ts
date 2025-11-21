
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";
import { SYSTEM_PROMPT } from "../constants";

const apiKey = process.env.API_KEY;

const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key' });

// --- Retry Helper ---
const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000;

const generateWithRetry = async (apiCall: () => Promise<any>, retries = MAX_RETRIES): Promise<any> => {
  try {
    return await apiCall();
  } catch (e: any) {
    if (retries > 0 && (e.status === 500 || e.status === 503 || e.message?.includes('Internal error'))) {
      console.warn(`Gemini API 500 Error. Retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
      const delay = INITIAL_DELAY * Math.pow(2, MAX_RETRIES - retries); // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateWithRetry(apiCall, retries - 1);
    }
    throw e;
  }
};
// --------------------

export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Generates a vector embedding for the asset using text-embedding-004.
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
  if (!apiKey) return [];
  try {
    const response = await generateWithRetry(() => ai.models.embedContent({
      model: 'text-embedding-004',
      contents: [{ parts: [{ text }] }]
    }));
    return response.embeddings?.[0]?.values || [];
  } catch (e) {
    console.error("Embedding failed", e);
    return [];
  }
};

export const analyzeImage = async (base64Data: string, mimeType: string): Promise<AnalysisResult> => {
  if (!apiKey) {
    throw new Error("API Key is missing");
  }

  try {
    const response = await generateWithRetry(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { text: SYSTEM_PROMPT },
          { inlineData: { mimeType: mimeType, data: base64Data } }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            project: { type: Type.STRING },
            genre: { type: Type.STRING }, 
            style: { type: Type.STRING }, 
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            visual: {
              type: Type.OBJECT,
              properties: {
                composition: { type: Type.STRING }, 
                mainSubject: { type: Type.STRING },
                subjectBox: { // Bounding Box
                   type: Type.OBJECT,
                   properties: {
                     ymin: { type: Type.NUMBER },
                     xmin: { type: Type.NUMBER },
                     ymax: { type: Type.NUMBER },
                     xmax: { type: Type.NUMBER },
                     label: { type: Type.STRING }
                   }
                },
                visualDensity: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                cameraAngle: { type: Type.STRING },
                ocrText: { type: Type.ARRAY, items: { type: Type.STRING } },
                realColorPalette: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      hex: { type: Type.STRING },
                      percentage: { type: Type.NUMBER },
                      isWarm: { type: Type.BOOLEAN }
                    }
                  }
                },
                uiElements: { 
                  type: Type.ARRAY, 
                  items: { 
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      box: {
                         type: Type.OBJECT,
                         properties: {
                           ymin: { type: Type.NUMBER },
                           xmin: { type: Type.NUMBER },
                           ymax: { type: Type.NUMBER },
                           xmax: { type: Type.NUMBER },
                           label: { type: Type.STRING }
                         }
                      }
                    }
                  } 
                },
              }
            },
            marketing: {
              type: Type.OBJECT,
              properties: {
                hookType: { type: Type.STRING }, 
                hookStrength: { type: Type.NUMBER },
                emotionalTrigger: { type: Type.STRING },
                targetAudience: { type: Type.STRING },
                painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                callToAction: { type: Type.STRING },
                valueProposition: { type: Type.STRING },
              }
            },
            strategy: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.NUMBER },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                improvementTips: { type: Type.ARRAY, items: { type: Type.STRING } },
                midjourneyPrompt: { type: Type.STRING },
                jimengPrompt: { type: Type.STRING },
                replicationTemplate: {
                  type: Type.OBJECT,
                  properties: {
                    visualFormula: { type: Type.STRING },
                    hookBlueprint: { type: Type.STRING },
                    compositionGuide: { type: Type.STRING },
                    colorStrategy: { type: Type.STRING }
                  }
                },
                adCopyVariations: { 
                  type: Type.ARRAY, 
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      headline: { type: Type.STRING },
                      body: { type: Type.STRING }
                    }
                  }
                },
              }
            },
            risk: {
              type: Type.OBJECT,
              properties: {
                riskScore: { type: Type.INTEGER },
                flags: { type: Type.ARRAY, items: { type: Type.STRING } },
                platformCompliance: { type: Type.STRING },
              }
            },
          }
        }
      }
    }));

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const json = JSON.parse(text);
    return json as AnalysisResult;
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
};
