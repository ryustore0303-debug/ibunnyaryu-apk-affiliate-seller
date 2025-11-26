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
 * Helper to get a random API key from the list.
 * STRICTLY uses VITE_API_KEYS from environment variables.
 */
const getRandomApiKey = (): string => {
  // Access the environment variable injected by Vite/Vercel
  const keysString = import.meta.env.VITE_API_KEYS;
  
  if (!keysString) {
    throw new Error("API Keys not configured. Please add 'VITE_API_KEYS' in your Vercel Environment Variables settings.");
  }

  // Split by comma, trim whitespace, and filter empty strings
  const keys = keysString.split(',').map(k => k.trim()).filter(k => k.length > 0);
  
  if (keys.length === 0) {
    throw new Error("VITE_API_KEYS variable is empty. Please check your Vercel settings.");
  }

  // Randomly select one key for load balancing
  const randomIndex = Math.floor(Math.random() * keys.length);
  return keys[randomIndex];
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

  const maxRetries = 3; // Try up to 3 different keys
  let lastError: any;

  // INTELLIGENT KEY ROTATION LOOP
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Pick a NEW key for every attempt/retry
    let activeKey: string;
    try {
      activeKey = getRandomApiKey();
    } catch (e: any) {
      throw new Error(e.message);
    }

    const ai = new GoogleGenAI({ apiKey: activeKey });

    try {
      // console.log(`Attempt ${attempt + 1} using key...`); 
      
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
        
        // Check for text refusal
        const textPart = response.candidates[0].content.parts.find(p => p.text);
        if (textPart && textPart.text) {
          throw new Error(`AI Refusal: ${textPart.text.substring(0, 150)}...`);
        }
      }
      throw new Error("No image data returned from API.");

    } catch (error: any) {
      console.warn(`Error on attempt ${attempt + 1}:`, error.message);
      lastError = error;
      
      // If error is related to Quota (429) or Server (500), try next key.
      const isRetryable = true; 
      
      if (isRetryable && attempt < maxRetries) {
         await new Promise(resolve => setTimeout(resolve, 800)); // Small delay
         continue; // Try loop again with a NEW KEY
      }
      break; // Stop loop if max retries reached
    }
  }

  throw lastError;
};