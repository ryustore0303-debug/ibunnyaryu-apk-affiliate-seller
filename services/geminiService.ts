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
 * Helper: Safely retrieve env vars without crashing
 */
const getSafeEnv = (key: string): string | undefined => {
  try {
    // 1. Try import.meta.env (Vite Standard)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
    
    // 2. Try process.env (Node / Vite Define)
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) {
    console.warn(`[EnvCheck] Failed to read ${key}`);
    return undefined;
  }
  return undefined;
};

/**
 * Generates an image using the Gemini 2.5 Flash Image model.
 * Handles API Key retrieval dynamically from multiple sources.
 */
export const generateImagenImage = async (
  prompt: string, 
  productImages: File[], 
  refImageFile?: File | null,
  logoFile?: File | null,
  faceFile?: File | null
): Promise<string> => {
  
  // LOGIC: Retrieve API Key safely - V9.0 STABILITY FIX
  // Prioritize VITE_API_KEY (Standard for Vercel/Vite)
  let activeKey = getSafeEnv('VITE_API_KEY');

  // Fallback to API_KEY
  if (!activeKey) {
    activeKey = getSafeEnv('API_KEY');
  }

  // Debugging Log (Safe, shows only last 4 chars)
  if (activeKey) {
     const safeLog = activeKey.length > 10 ? `...${activeKey.slice(-4)}` : 'INVALID';
     console.log(`[V9.0-FIX] API Key found: ${safeLog}`);
  } else {
     console.error("[V9.0-FIX] No API Key found in any environment variable.");
  }

  // Final Validation
  if (!activeKey || activeKey.length < 10) {
    console.error("CRITICAL ERROR: No valid API Key found in environment variables.");
    throw new Error("MISSING_KEYS");
  }

  // Handle multiple keys rotation (comma separated)
  const keys = activeKey.split(/[,\n]+/).map(k => k.trim()).filter(k => k.length > 0);
  
  // Use Smart Loop for Retries
  const maxKeyRetries = keys.length;
  let lastError: any = null;

  for (let i = 0; i < maxKeyRetries; i++) {
    const currentKey = keys[i];
    
    // Mask key for logging safety (show last 4 chars)
    const maskedKey = `...${currentKey.slice(-4)}`;
    console.log(`[V9.0-FIX] Attempting with Key #${i+1} (${maskedKey})`);

    try {
      const ai = new GoogleGenAI({ apiKey: currentKey });
      
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

      // Call API
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
      });

      // Extract image
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
        
        const textPart = response.candidates[0].content.parts.find((p: any) => p.text);
        if (textPart && textPart.text) {
           throw new Error(`AI Refusal: ${textPart.text.substring(0, 150)}...`);
        }
      }
      
      throw new Error("Empty response from AI");

    } catch (error: any) {
      lastError = error;
      const msg = error.message || "";
      console.warn(`Key #${i+1} failed: ${msg}`);

      // If error is NOT about Quota/Limit (e.g. Safety or Bad Request), stop trying other keys.
      if (msg.includes('Refusal') || msg.includes('SAFETY') || msg.includes('400')) {
        throw error;
      }

      // If it is 429/Quota, loop will continue to next key...
    }
  }

  // If all keys failed
  throw lastError || new Error("All API keys failed or quota exhausted.");
};