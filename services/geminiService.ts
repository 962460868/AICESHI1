import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";
import { SYSTEM_PROMPT } from "../constants";

const apiKey = process.env.API_KEY;

const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key' });

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

export const analyzeImage = async (base64Data: string, mimeType: string): Promise<AnalysisResult> => {
  if (!apiKey) {
    console.error("API Key is missing");
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }

  try {
    const response = await ai.models.generateContent({
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
            genre: { type: Type.STRING },
            style: { type: Type.STRING },
            tags: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                    category: { type: Type.STRING },
                    value: { type: Type.STRING }
                }
              } 
            },
            visual: {
              type: Type.OBJECT,
              properties: {
                composition: { type: Type.STRING },
                mainSubject: { type: Type.STRING },
                colorPalette: { type: Type.ARRAY, items: { type: Type.STRING } },
                lighting: { type: Type.STRING },
                cameraAngle: { type: Type.STRING },
                sceneDescription: { type: Type.STRING },
                visualHierarchy: { type: Type.STRING },
              }
            },
            marketing: {
              type: Type.OBJECT,
              properties: {
                hookType: { type: Type.STRING },
                emotionalTrigger: { type: Type.STRING },
                targetAudience: { type: Type.STRING },
                painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                valueProposition: { type: Type.STRING },
                callToAction: { type: Type.STRING },
              }
            },
            strategy: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.NUMBER },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                improvementTips: { type: Type.ARRAY, items: { type: Type.STRING } },
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
                variantIdeas: { type: Type.ARRAY, items: { type: Type.STRING } },
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
            replicationPrompt: { type: Type.STRING },
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
};
