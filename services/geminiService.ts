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
  
  // LOGIC: Retrieve API Key safely
  let activeKey = getSafeEnv('VITE_API_KEY');

  if (!activeKey) {
    activeKey = getSafeEnv('API_KEY');
  }

  // Final Validation
  if (!activeKey || activeKey.length < 10) {
    const err = new Error("MISSING_KEYS");
    // @ts-ignore
    err.debugInfo = { keyHint: "NONE", originalError: "No Key Found in Env" };
    throw err;
  }

  // Handle multiple keys rotation (comma separated)
  const keys = activeKey.split(/[,\n]+/).map(k => k.trim()).filter(k => k.length > 0);
  
  const maxKeyRetries = keys.length;
  let lastError: any = null;

  for (let i = 0; i < maxKeyRetries; i++) {
    const currentKey = keys[i];
    
    // Mask key for logging safety
    const maskedKey = `...${currentKey.slice(-4)}`;
    console.log(`[v5.STABLE] Attempting with Key #${i+1} (${maskedKey})`);

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
      console.warn(`[v5.STABLE] Key #${i+1} failed: ${msg}`);
      
      // Augment error object
      // @ts-ignore
      error.debugInfo = { keyHint: maskedKey, originalError: msg };

      // Stop on critical errors (Safety, Auth, Bad Request) that are NOT quota related
      if (msg.includes('Refusal') || msg.includes('SAFETY') || msg.includes('400') || msg.includes('403') || msg.includes('enabled')) {
        throw error;
      }

      // HANDLE RATE LIMITS (429) -> FAST FAIL but with polite delay
      if (msg.includes('429') || msg.includes('Quota') || msg.includes('RESOURCE_EXHAUSTED')) {
         console.log(`[v5.STABLE] Key #${i+1} exhausted. Waiting 1.5s before next key...`);
         // Soft Delay to avoid instant burst spam
         await new Promise(resolve => setTimeout(resolve, 1500));
         continue; 
      }
    }
  }

  // If all keys failed
  throw lastError || new Error("All API keys failed or quota exhausted.");
};