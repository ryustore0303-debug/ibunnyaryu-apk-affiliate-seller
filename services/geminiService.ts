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
 * Generates an image using the Gemini 2.5 Flash Image model.
 * Includes automatic API Key rotation to handle rate limits.
 */
export const generateImagenImage = async (
  prompt: string, 
  productImages: File[], 
  refImageFile?: File | null,
  logoFile?: File | null,
  faceFile?: File | null
): Promise<string> => {
  
  const parts: any[] = [];

  // 1. Add Main Product Images
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

  // 2. Add Reference Image
  if (refImageFile) {
    const base64Data = await fileToBase64(refImageFile);
    parts.push({
      inlineData: {
        mimeType: refImageFile.type,
        data: base64Data
      }
    });
  }

  // 3. Add Logo Image
  if (logoFile) {
    const base64Data = await fileToBase64(logoFile);
    parts.push({
      inlineData: {
        mimeType: logoFile.type,
        data: base64Data
      }
    });
  }

  // 4. Add Face Image
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

  // --- API KEY ROTATION LOGIC ---
  // Get keys from env, split by comma or newline, trim whitespace, remove empty strings
  const envKeys = process.env.API_KEY || "";
  const keys = envKeys.split(/[,\n]+/).map(k => k.trim()).filter(k => k.length > 0);

  if (keys.length === 0) {
    throw new Error("API_KEY not found in environment variables.");
  }

  // Pick a random key from the list to distribute load
  const activeKey = keys[Math.floor(Math.random() * keys.length)];
  
  // Initialize the client using the selected key
  const ai = new GoogleGenAI({ apiKey: activeKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Model for General Image Generation and Editing Tasks
      contents: { parts },
    });

    // Success? Extract image.
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      
      // Check for text refusal (Safety filters often return text)
      const textPart = response.candidates[0].content.parts.find((p: any) => p.text);
      if (textPart && textPart.text) {
         throw new Error(`AI Refusal: ${textPart.text.substring(0, 150)}...`);
      }
    }
    throw new Error("No image data returned from API.");

  } catch (error: any) {
    console.warn(`API error (Key ending in ...${activeKey.slice(-4)}):`, error.message);
    throw error;
  }
};