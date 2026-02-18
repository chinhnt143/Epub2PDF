import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateBookSummary = async (title: string, author: string, extract: string): Promise<string> => {
  try {
    const ai = getClient();
    
    // We use the flash model for speed and efficiency in summarization
    const model = 'gemini-3-flash-preview';
    
    const prompt = `
      You are an expert literary analyst and executive summarizer.
      
      Book Title: ${title}
      Author: ${author}
      
      Below is an extract (first few chapters) from the book:
      "${extract.substring(0, 30000)}..." 
      
      Please provide a comprehensive "Study Guide" or "Executive Summary" for this book.
      Format it in clean HTML (using <h2>, <h3>, <p>, <ul>, <li> tags ONLY).
      Do not include <html>, <body>, or markdown backticks.
      
      Structure:
      1. Brief Overview
      2. Key Themes/Concepts
      3. Style & Tone
      4. What to expect
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "<p>Could not generate summary.</p>";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `<p>Failed to generate AI summary. Please check your API key or network connection.</p>`;
  }
};