
import { GoogleGenAI, Type } from "@google/genai";

export const suggestActivitiesForEnvironment = async (environment: string): Promise<string[]> => {
  try {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `Você é um especialista em gestão de facilities. Sugira uma lista de atividades comuns de limpeza e manutenção para um(a) "${environment}". Responda apenas com um array JSON de strings, onde cada string é um nome de atividade curto e acionável. Por exemplo: ["Limpar pisos", "Limpar janelas", "Desinfetar superfícies"]. Não inclua nenhum outro texto ou explicação.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
            description: 'Uma atividade de limpeza ou manutenção.',
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