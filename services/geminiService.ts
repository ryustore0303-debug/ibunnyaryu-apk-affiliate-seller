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
 * Helper: Sleep/Delay for retries
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generates an image using the Gemini 2.5 Flash Image model.
 * Includes TRUE AUTOMATIC API KEY ROTATION (Smart Retry).
 */
export const generateImagenImage = async (
  prompt: string, 
  productImages: File[], 
  refImageFile?: File | null,
  logoFile?: File | null,
  faceFile?: File | null
): Promise<string> => {
  
  // 0. FORCE NEW VERSION DETECTOR
  console.log("Using Service V5.0 - Smart Rotation Active");

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

  // --- API KEY ROTATION LOGIC (SMART LOOP) ---
  const envKeys = process.env.API_KEY || "";
  const keys = envKeys.split(/[,\n]+/).map(k => k.trim()).filter(k => k.length > 0);

  if (keys.length === 0) {
    throw new Error("API_KEY not found in environment variables.");
  }

  // Shuffle keys to distribute load initially
  const shuffledKeys = [...keys].sort(() => 0.5 - Math.random());
  
  let lastError: Error | null = null;

  // LOOP through available keys
  for (const apiKey of shuffledKeys) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image', // Fixed Model
        contents: { parts },
      });

      // Success? Extract image.
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
        
        // Check for text refusal
        const textPart = response.candidates[0].content.parts.find((p: any) => p.text);
        if (textPart && textPart.text) {
           // If refused, don't retry other keys, it's a prompt issue.
           throw new Error(`AI Refusal: ${textPart.text.substring(0, 150)}...`);
        }
      }
      
      // If we got here, response format was unexpected but no error thrown
      throw new Error("Empty response from AI");

    } catch (error: any) {
      lastError = error;
      const msg = error.message || "";
      
      // If error is 429 (Quota) or 503 (Server Overload), Try Next Key!
      if (msg.includes('429') || msg.includes('Quota') || msg.includes('503') || msg.includes('RESOURCE_EXHAUSTED')) {
        console.warn(`Key ...${apiKey.slice(-4)} exhausted. Switching to next key...`);
        await sleep(500); // Wait 0.5s before trying next key
        continue; // Try next key in loop
      } else {
        // If it's another error (like 400 Bad Request / Safety), stop retrying.
        throw error;
      }
    }
  }

  // If loop finishes and we still have no image
  throw lastError || new Error("All API Keys exhausted or failed.");
};