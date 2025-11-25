import { GoogleGenAI } from "@google/genai";

/**
 * Helper to read a file as Base64.
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = error => reject(error);
  });
};

/**
 * Generates an image using the Gemini Flash Image model.
 * @param prompt The text prompt for image generation.
 * @param productImages Array of main product images (max 3).
 * @param refImageFile Optional background reference image.
 * @param logoFile Optional logo image.
 * @param faceFile Optional face reference image (for Model mode).
 * @returns Base64 string of the generated image.
 */
export const generateImagenImage = async (
  prompt: string, 
  productImages: File[], 
  refImageFile?: File | null,
  logoFile?: File | null,
  faceFile?: File | null
): Promise<string> => {
  try {
    // Initialize the client with the API key from environment variables
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const parts: any[] = [];

    // 1. Add Main Product Images (Loop through array)
    if (productImages && productImages.length > 0) {
      for (const img of productImages) {
        const base64Data = await fileToBase64(img);
        parts.push({
          inlineData: {
            mimeType: img.type,
            data: base64Data
          }
        });
      }
    }

    // 2. Add Reference Image (if exists)
    if (refImageFile) {
      const base64Data = await fileToBase64(refImageFile);
      parts.push({
        inlineData: {
          mimeType: refImageFile.type,
          data: base64Data
        }
      });
    }

    // 3. Add Logo Image (if exists)
    if (logoFile) {
      const base64Data = await fileToBase64(logoFile);
      parts.push({
        inlineData: {
          mimeType: logoFile.type,
          data: base64Data
        }
      });
    }

    // 4. Add Face Image (if exists)
    if (faceFile) {
      const base64Data = await fileToBase64(faceFile);
      parts.push({
        inlineData: {
          mimeType: faceFile.type,
          data: base64Data
        }
      });
    }

    // 5. Add the text prompt
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
    });

    // Iterate through parts to find the generated image
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No image data returned from API.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};