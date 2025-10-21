
import { GoogleGenAI, Type } from "@google/genai";

export const suggestActivitiesForEnvironment = async (environment: string): Promise<string[]> => {
  try {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `You are a facility management expert. Suggest a list of common cleaning and maintenance activities for a "${environment}". Respond with only a JSON array of strings, where each string is a short, actionable activity name. For example: ["Clean floors", "Wipe windows", "Disinfect surfaces"]. Do not include any other text or explanation.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
            description: 'A cleaning or maintenance activity.',
          },
        },
      },
    });

    const jsonStr = response.text.trim();
    const suggestions = JSON.parse(jsonStr);
    
    if (Array.isArray(suggestions) && suggestions.every(item => typeof item === 'string')) {
      return suggestions;
    }
    return [];

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return [];
  }
};
