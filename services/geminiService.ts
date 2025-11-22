import { GoogleGenAI, Type } from "@google/genai";
import { ScanResult } from "../types";

// Using Gemini 2.5 Flash for superior multimodal understanding
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    throw error;
  }
};

export const analyzePackageText = async (text: string): Promise<ScanResult> => {
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
    throw error;
  }
};