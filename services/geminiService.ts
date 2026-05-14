import { GoogleGenAI } from "@google/genai";

export const generateChristmasGreeting = async (style: string): Promise<string> => {
  if (!process.env.API_KEY) {
    return "请配置 API KEY 以获取 AI 祝福语！";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `Generate a short, fun, and warm Christmas greeting message in Chinese (Simplified) suitable for an avatar caption. 
    Style: ${style}. 
    Maximum 25 words. 
    Include 2-3 appropriate emojis. 
    Return ONLY the text string.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || "圣诞快乐！🎄";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI 暂时休息了，祝你圣诞快乐！🎅";
  }
};
