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
 * Helper to get ALL API keys as an array.
 * Reads from process.env.API_KEY environment variable.
 */
const getApiKeys = (): string[] => {
  // Access the environment variable standard
  const keysString = process.env.API_KEY;
  
  if (!keysString) {
    throw new Error("API Key not found. Please set 'API_KEY' environment variable.");
  }

  // Split by comma OR newline to handle both formats robustly for rotation
  // Trim whitespace and filter empty strings
  const keys = keysString.split(/[,\n]+/).map(k => k.trim()).filter(k => k.length > 0);
  
  // Debug Log (Visible in Browser Console F12)
  console.log(`[System] Detected ${keys.length} API Keys available in environment.`);
  
  if (keys.length === 0) {
    throw new Error("API_KEY variable is empty.");
  }

  return keys;
};

/**
 * Shuffle array logic to randomize start order
 */
const shuffleArray = (array: string[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

/**
 * Generates an image using the Gemini 2.5 Flash Image model.
 * Uses strict sequential rotation strategy for API keys to handle 429 errors.
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

  // --- ROTATION STRATEGY ---
  // 1. Get all keys
  let keys = getApiKeys();
  
  // 2. Shuffle them once so we don't always start with Key #1 (Distribution)
  keys = shuffleArray(keys);

  let lastError: any;

  // 3. Loop through keys sequentially. If one fails, try the next.
  for (let i = 0; i < keys.length; i++) {
    const activeKey = keys[i];
    const ai = new GoogleGenAI({ apiKey: activeKey });
    const maskedKey = `...${activeKey.slice(-4)}`;

    try {
      console.log(`[Attempt ${i + 1}/${keys.length}] Requesting with key ${maskedKey}`);
      
      // Delay sedikit agar tidak dianggap spamming cepat oleh Google
      if (i > 0) await new Promise(r => setTimeout(r, 1000));

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image', // Use the robust Gemini Flash Image model
        contents: { parts },
        // Note: responseMimeType is not supported for nano banana series (flash-image)
      });

      // Success? Extract image.
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            console.log(`[Success] Image generated with key ${maskedKey}`);
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
        
        // Check for text refusal (Safety filters often return text)
        const textPart = response.candidates[0].content.parts.find(p => p.text);
        if (textPart && textPart.text) {
           // If it's a safety refusal, switching keys won't help. Throw immediately.
           throw new Error(`AI Refusal: ${textPart.text.substring(0, 150)}...`);
        }
      }
      throw new Error("No image data returned from API.");

    } catch (error: any) {
      console.warn(`[Fail] Key ${maskedKey} error:`, error.message);
      lastError = error;

      const msg = error.message || '';
      
      // CRITICAL: Decide if we should retry with next key
      // Retry on: 429 (Quota), 5xx (Server Error), or Network Error
      const isQuotaError = msg.includes('429') || msg.includes('Quota') || msg.includes('RESOURCE_EXHAUSTED');
      const isServerError = msg.includes('500') || msg.includes('503') || msg.includes('Overloaded');
      const isFetchError = msg.includes('fetch') || msg.includes('network');

      if (isQuotaError || isServerError || isFetchError) {
         // Continue loop to use NEXT key
         continue; 
      }
      
      // If it's a 400 (Bad Request) or Safety Block, don't retry other keys, it's useless.
      break; 
    }
  }

  // If we exit the loop, it means all keys failed
  throw lastError;
};