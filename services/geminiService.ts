import { GoogleGenAI } from "@google/genai";

// Daftar 10 API Key untuk rotasi (Load Balancing)
const API_KEYS = [
  "AIzaSyDk3UfhugolNoV9WCCGOjbPkAtQOFV_9",
  "AIzaSyB6odJJOSFFkvEU08aETUxNUydPghu-s2Q",
  "AIzaSyBZe2mped-YrKrYLQ8wlx-Ed1BdFRXXalI",
  "AIzaSyC_WC6d6etIwckmLPbvpd4sPjqZGKiid5c",
  "AIzaSyAZ6TToxMzrKDodMiDQX7VD-MH3iiH2170",
  "AIzaSyAPZ96vdc6deu4YOaHwI5ZjRStbzk0d3tk",
  "AIzaSyDlU9BsuQy4iZM6HTv8ipZMj4vmTBa1I1c",
  "AIzaSyD2HQGI13g2m5ObhLrk7Z3yf5TKIZkidHI",
  "AIzaSyDD1Dr7GJ4SuQbXOxRBrfw7gy-t7c2nER8",
  "AIzaSyC08nL-vwft5-qAw7PGqdj2-3TsZB68IJA"
];

/**
 * Helper untuk mengambil API Key secara acak dari daftar.
 * Ini membantu menghindari Rate Limit dengan mendistribusikan request ke 10 key berbeda.
 */
const getRandomKey = () => {
  const randomIndex = Math.floor(Math.random() * API_KEYS.length);
  return API_KEYS[randomIndex];
};

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
  productImages: File[], // Changed to array
  refImageFile?: File | null,
  logoFile?: File | null,
  faceFile?: File | null
): Promise<string> => {
  try {
    // Initialize the client with a RANDOM key for each request
    const activeKey = getRandomKey();
    const ai = new GoogleGenAI({ apiKey: activeKey });

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