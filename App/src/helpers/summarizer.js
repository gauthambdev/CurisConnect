// utils/summarizer.js
import axios from 'axios';

export const summarizeText = async (extractedText) => {
  try {
    // Replace with your Gemini API key and endpoint
    const GEMINI_API_KEY = ""; // Obtain from Google AI Studio
    const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

    const prompt = `
      Summarize this medical report text into short, simple, and concise points. 
      Use layman terms, make it easy to understand, and don't miss key details: 
      "${extractedText}"
    `;

    const response = await axios.post(
      apiUrl,
      {
        text: prompt,
        max_length: 100, // Adjust as needed
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Assuming the API returns a summary split by newlines
    const summaryPoints = response.data.summary.split('\n').filter(point => point.trim());
    return summaryPoints;
  } catch (error) {
    console.error('Error summarizing text:', error);
    throw new Error('Failed to summarize the text');
  }
};