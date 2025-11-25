import { GoogleGenAI } from "@google/genai";

/**
 * Helper to extract image from GenerateContent response
 */
const extractImageFromResponse = (response: any): string => {
  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error("No candidates returned from Gemini.");
  }

  const parts = candidates[0].content?.parts;
  if (!parts) {
    throw new Error("No content parts returned.");
  }

  // Look for the inline image data
  for (const part of parts) {
    if (part.inlineData && part.inlineData.data) {
      // The API returns the mimeType, typically 'image/png' or 'image/jpeg'
      const mimeType = part.inlineData.mimeType || 'image/png';
      return `data:${mimeType};base64,${part.inlineData.data}`;
    }
  }

  // If no image found, check if there's text (error message or refusal)
  const textPart = parts.find((p: any) => p.text);
  if (textPart) {
    console.warn("Gemini returned text instead of image:", textPart.text);
    throw new Error(`Gemini refused to generate image: ${textPart.text.substring(0, 100)}...`);
  }

  throw new Error("No image data found in response.");
};

/**
 * Helper to safely get the API key from various environment configurations.
 * Priorities:
 * 1. process.env.API_KEY (System default)
 * 2. import.meta.env.VITE_API_KEY (Vite default)
 * 3. import.meta.env.VITE_GOOGLE_API_KEY (Alternative)
 */
const getApiKey = (): string => {
  // 1. Check process.env (standard Node/Webpack/System)
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  
  // 2. Check Vite environment variables (import.meta.env)
  // Using try-catch/checks to avoid compilation errors if bundler doesn't support import.meta
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      if (import.meta.env.VITE_API_KEY) return import.meta.env.VITE_API_KEY;
      // @ts-ignore
      if (import.meta.env.VITE_GOOGLE_API_KEY) return import.meta.env.VITE_GOOGLE_API_KEY;
    }
  } catch (e) {
    // Ignore errors accessing import.meta
  }

  return "";
};

/**
 * Generates an image based on a prompt.
 * Uses Gemini 2.5 Flash Image for both text-to-image and image-to-image.
 */
export const generateVariation = async (
  prompt: string,
  sourceImageBase64?: string | null
): Promise<string> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("API Key not found. Please set VITE_API_KEY in your environment variables.");
    }

    const ai = new GoogleGenAI({ apiKey });

    let contents: any;

    if (sourceImageBase64) {
      // IMAGE-TO-IMAGE (Variation)
      // Remove header if present for cleaner processing
      const cleanBase64 = sourceImageBase64.replace(/^data:image\/\w+;base64,/, '');
      
      contents = {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png', // Assume PNG/JPEG common web formats
              data: cleanBase64,
            }
          },
          {
            text: `Generate a new high-quality image based on this input. ${prompt}`,
          }
        ]
      };
    } else {
      // TEXT-TO-IMAGE (First Generation)
      contents = {
        parts: [
          {
            text: `Generate a high-quality, photorealistic image of: ${prompt}`,
          }
        ]
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: contents,
      config: {
        // No specific responseMimeType needed for this model
      }
    });

    return extractImageFromResponse(response);

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

/**
 * Edits an image based on an instruction.
 */
export const editImage = async (
  imageBase64: string,
  instruction: string
): Promise<string> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("API Key not found. Please set VITE_API_KEY in your environment variables.");
    }

    const ai = new GoogleGenAI({ apiKey });

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: cleanBase64,
            }
          },
          {
            text: `Edit this image based on this instruction: ${instruction}. Return the edited image.`,
          }
        ]
      }
    });

    return extractImageFromResponse(response);

  } catch (error) {
    console.error("Gemini Edit Error:", error);
    throw error;
  }
};