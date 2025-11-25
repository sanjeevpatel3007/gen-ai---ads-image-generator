import { GoogleGenAI } from "@google/genai";

// Initialize the client
// NOTE: In a real app, ensure process.env.API_KEY is defined in your environment (e.g. .env file)
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

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
 * Generates an image based on a prompt.
 * Uses Gemini 2.5 Flash Image for both text-to-image and image-to-image.
 */
export const generateVariation = async (
  prompt: string,
  sourceImageBase64?: string | null
): Promise<string> => {
  try {
    let contents: any;

    if (sourceImageBase64) {
      // IMAGE-TO-IMAGE (Variation)
      // Remove header if present for cleaner processing, though SDK handles standard base64 often.
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
      // We use generateContent with gemini-2.5-flash-image for text-to-image as well
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
        // No specific responseMimeType needed for this model to generate images in parts
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