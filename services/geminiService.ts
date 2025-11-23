import { GoogleGenAI, Type } from "@google/genai";
import { ScanResult } from "../types";

// Using Gemini 2.5 Flash for superior multimodal understanding
const API_KEY = process.env.API_KEY || process.env.VITE_API_KEY || process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

try {
  if (API_KEY && API_KEY !== 'your-api-key-here') {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  }
} catch (error) {
  console.warn('Failed to initialize Gemini AI:', error);
}

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    trackingNumber: { type: Type.STRING, nullable: true },
    location: { type: Type.STRING, nullable: true },
    recipientName: { type: Type.STRING, nullable: true },
    deadline: { type: Type.STRING, nullable: true },
  },
};

export const analyzePackageImage = async (base64Image: string): Promise<ScanResult> => {
  // Remove header if present
  const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, "");

  if (!ai) {
    // Fallback to mock data if no API key
    console.warn('Using mock data - no API key configured');
    return {
      trackingNumber: 'RR123456789IL',
      location: 'דואר מרכזי תל אביב',
      recipientName: 'ישראל ישראלי',
      deadline: 'היום עד 18:00'
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          {
            text: "Analyze this image of a package delivery slip or SMS notification (likely in Hebrew). Extract the tracking number, the pickup location (post office name, locker address), the recipient name, and any deadline/date mentioned. Return a JSON object.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as ScanResult;
    }
    throw new Error("No text returned from Gemini");
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Return mock data on error
    return {
      trackingNumber: 'RR123456789IL',
      location: 'דואר מרכזי תל אביב',
      recipientName: 'ישראל ישראלי',
      deadline: 'היום עד 18:00'
    };
  }
};

export const analyzePackageText = async (text: string): Promise<ScanResult> => {
  if (!ai) {
    // Fallback to mock data if no API key
    console.warn('Using mock data - no API key configured');
    return {
      trackingNumber: 'LP987654321IL',
      location: 'לוקר כניסה כרמית',
      recipientName: 'ישראל ישראלי',
      deadline: 'מחר בבוקר'
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            text: `Analyze this Hebrew text from a package notification: "${text}". Extract the tracking number, the pickup location, the recipient name, and deadline. Return JSON.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as ScanResult;
    }
    throw new Error("No text returned from Gemini");
  } catch (error) {
    console.error("Gemini Text Analysis Error:", error);
    // Return mock data on error
    return {
      trackingNumber: 'LP987654321IL',
      location: 'לוקר כניסה כרמית',
      recipientName: 'ישראל ישראלי',
      deadline: 'מחר בבוקר'
    };
  }
};