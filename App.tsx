import React, { useState } from 'react';
import { Heart, Settings2, ExternalLink } from 'lucide-react';
import GlassCard from './components/GlassCard';
import ModeSelector from './components/ModeSelector';
import PromptForm from './components/PromptForm';
import ImageGallery from './components/ImageGallery';
import { AppMode, FormData, GeneratedImage } from './types';
import { GENDERS, HIJAB_OPTIONS, POV_AESTHETIC_PROMPTS, PRODUCT_AESTHETIC_PROMPTS, POV_HAND_VARIATIONS, LIGHTING_OPTIONS, AMBIENCE_OPTIONS, LOCATION_OPTIONS, MODEL_TYPES, VISUAL_STYLES, MODEL_POSES, MODEL_BG_VARIATIONS } from './constants';
import { generateImagenImage } from './services/geminiService';

const INITIAL_FORM_DATA: FormData = {
  productImages: [], // Changed to array
  bgReferenceImage: null,
  logoImage: null,
  faceImage: null,
  lighting: LIGHTING_OPTIONS[0],
  ambience: AMBIENCE_OPTIONS[0],
  location: LOCATION_OPTIONS[0],
  gender: GENDERS[0],
  modelType: MODEL_TYPES[0],
  ageRange: '25 tahun', // Default manual string
  visualStyle: VISUAL_STYLES[0],
  hijab: HIJAB_OPTIONS[0],
  bgDesc: ''
};

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.POV);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<{keyHint: string, originalError: string} | null>(null);
  const [resetKey, setResetKey] = useState(0);

  const handleFormChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Generic helper to shuffle prompts
  const getRandomPrompts = (sourceArray: string[], count: number) => {
    const shuffled = [...sourceArray].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const handleGenerate = async () => {
    setError(null);
    setDebugInfo(null);

    // Check array length instead of single object null
    if (formData.productImages.length === 0) {
      setError("⚠️ Wajib upload minimal 1 gambar produk!");
      return;
    }

    setIsGenerating(true);
    
    // Initialize placeholders
    const newImages: GeneratedImage[] = Array.from({ length: 4 }).map((_, i) => ({
      id: `pending-${Date.now()}-${i}`,
      url: '',
      isLoading: true
    }));
    setImages(newImages);

    // Select random prompts based on mode
    const randomPovPrompts = getRandomPrompts(POV_AESTHETIC_PROMPTS, 4);
    const randomHandVariations = getRandomPrompts(POV_HAND_VARIATIONS, 4);
    const randomProductPrompts = getRandomPrompts(PRODUCT_AESTHETIC_PROMPTS, 4);
    
    // For Model Mode: Randomize poses and backgrounds
    const randomModelPoses = getRandomPrompts(MODEL_POSES, 4);
    const randomModelBackgrounds = getRandomPrompts(MODEL_BG_VARIATIONS, 4);

    // --- SEQUENTIAL EXECUTION (Fix for 429 Rate Limits) ---
    // Instead of Promise.all, we loop through and await one by one.
    
    for (let index = 0; index < 4; index++) {
      const currentImageId = newImages[index].id;
      
      // COOLDOWN: Jeda 5 detik antar gambar agar tidak dideteksi spam oleh Google
      if (index > 0) {
        console.log(`[v4.FAST-FAIL] Cooling down... waiting 5s before image #${index + 1}`);
        await new Promise(r => setTimeout(r, 5000));
      }

      try {
        let promptText = "";
        let refImage: File | null = null;
        let logoImage: File | null = null;
        let faceImage: File | null = null;
        
        if (mode === AppMode.POV) {
          promptText += "High quality product photography. Show the uploaded product image(s) exactly as is. ";
          const handVariation = randomHandVariations[index];
          
          // Logic: If bgReferenceImage exists, use it for the FIRST image (index 0)
          if (index === 0 && formData.bgReferenceImage) {
            promptText += `Create a POV shot where a hand is holding the product(s). ${handVariation} The background MUST match the provided reference background image exactly. Blend the product naturally into the scene.`;
            refImage = formData.bgReferenceImage;
          } else {
            // For other images (or if no ref bg), use random aesthetic prompts + random hand variations
            promptText += `Create a realistic POV shot where a hand is holding the product(s). ${handVariation} Background context: ${randomPovPrompts[index]}`;
            
            // Append user manual description if exists
            if (formData.bgDesc) {
               promptText += ` Additional details: ${formData.bgDesc}.`;
            }
          }
        } 
        else if (mode === AppMode.PRODUK) {
          // Base scene from the random aesthetic list
          const selectedScene = randomProductPrompts[index];
          
          promptText = `Commercial Product Photography. Task: Contextually blend the uploaded product(s) into the following scene description: "${selectedScene}". `;
          promptText += `IMPORTANT: Analyze the uploaded product type (e.g., shoe, cosmetic, food, gadget) and ensure it sits naturally in this environment. If the environment seems physically impossible for this specific product, adapt the props slightly while keeping the aesthetic vibe. `;
          
          // Add user modifiers
          promptText += `Global Parameters - Lighting: ${formData.lighting}. Location: ${formData.location}. Atmosphere/Vibe: ${formData.ambience}. `;
          
          if (formData.logoImage) {
             promptText += "Integrate the uploaded logo image naturally into the scene (on the product packaging or as a background element). ";
             logoImage = formData.logoImage;
          }
          
          promptText += "Professional studio lighting, 8k resolution, hyper-realistic, highly detailed texture.";
        } 
        else if (mode === AppMode.MODEL) {
           // --- REVISED STRICT MODEL PROMPT ---
           promptText += "STRICT INSTRUCTION: Professional High-End Fashion Photography. ";
           
           // Pose and Background Variation
           const specificPose = randomModelPoses[index];
           const specificBg = randomModelBackgrounds[index];

           // Product Integration
           promptText += `Task: Create a seamless composition featuring the uploaded product(s). `;
           promptText += "CRITICAL: The product must be PHYSICALLY INTEGRATED. If clothing, it must drape/stretch realistically. No 'cutout' effect. ";

           // --- STRICT MODEL TYPE LOGIC ---
           if (formData.modelType === 'Manekin Kain') {
             // FORCE MANNEQUIN
             promptText += "SUBJECT TYPE: GHOST MANNEQUIN / CLOTH MANNEQUIN. ";
             promptText += "The product must be displayed on a neutral, headless, flexible fabric mannequin. ";
             promptText += "NEGATIVE PROMPT: NO HUMAN SKIN. NO REALISTIC FACES. NO EYES. NO HAIR. NO HUMAN MODELS. ";
             promptText += "Focus entirely on the 3D form and fit of the product on the dummy/mannequin. ";
           } else {
             // FORCE HUMAN - GENDER STRICTNESS
             const isMale = formData.gender === 'Pria';
             const genderString = isMale ? "MALE (MAN)" : "FEMALE (WOMAN)";
             
             promptText += `SUBJECT TYPE: REALISTIC ${genderString} MODEL. `;
             
             if (isMale) {
                promptText += "IMPORTANT: The model MUST be a MAN. Masculine physique, male facial features, male styling. ";
                promptText += "NEGATIVE PROMPT: DO NOT GENERATE A FEMALE MODEL. Do not generate long feminine hair. ";
             } else {
                promptText += "IMPORTANT: The model MUST be a WOMAN. Feminine physique. ";
                promptText += "NEGATIVE PROMPT: DO NOT GENERATE A MALE MODEL. ";
             }

             // Age
             const ageDesc = formData.ageRange ? formData.ageRange : 'young adult';
             promptText += `Approximate age: ${ageDesc}. `;

             // Hijab Logic (Only for Female)
             if (!isMale && formData.hijab && formData.hijab !== 'Non Hijab') {
               promptText += `Model is wearing a ${formData.hijab} that matches the outfit. `;
             } else if (!isMale) {
                promptText += "Model is NOT wearing a hijab. Hair styled naturally. ";
             }

             // Face Swap Logic
             if (formData.faceImage) {
               promptText += "FACE SWAP: The model's face MUST match the provided reference face image exactly. ";
               faceImage = formData.faceImage;
             } else {
               promptText += "Model should have a naturally beautiful, Indonesian look with realistic skin texture. ";
             }
           }

           // Framing & Scene
           promptText += `Pose: ${specificPose} `;
           promptText += `Visual Style: ${formData.visualStyle} aesthetic. Location: ${formData.location}. Background: ${specificBg} `;
           promptText += "Final output: Editorial fashion magazine quality, 8k, highly detailed.";
        }

        // Generate Image (Sequentially)
        const url = await generateImagenImage(promptText, formData.productImages, refImage, logoImage, faceImage);
        
        // Update state specifically for this image
        setImages(prev => prev.map(img => 
          img.id === currentImageId ? { ...img, url, isLoading: false } : img
        ));

      } catch (err: any) {
        console.error(err);
        
        // Error handling logic
        let errorMessage = err?.message || 'Gagal Memuat';
        const originalError = errorMessage;
        let keyHint = "UNKNOWN";

        try {
          if (err.debugInfo) {
             keyHint = err.debugInfo.keyHint;
             if (err.debugInfo.originalError) errorMessage = err.debugInfo.originalError;
          }
        } catch (e) {}
        
        if (errorMessage.includes('not enabled') || errorMessage.includes('enable') || errorMessage.includes('Precondition') || errorMessage.includes('403')) {
           setError("ACTIVATION_REQUIRED");
           setDebugInfo({ keyHint, originalError: errorMessage });
           // Fail specifically this image
           setImages(prev => prev.map(img => 
             img.id === currentImageId ? { ...img, error: "Layanan Belum Aktif", isLoading: false } : img
           ));
           // Break loop if service is fundamentally broken
           break;
        }

        if (errorMessage.includes('limit: 0') || errorMessage.includes('404')) {
           errorMessage = "⚠️ LAYANAN BELUM AKTIF. API Key Anda belum mengaktifkan layanan Google Generative AI.";
        } else if (errorMessage.includes('429') || errorMessage.includes('Quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
           errorMessage = "⚠️ Limit Kuota Habis (429).";
        } else if (errorMessage.includes('Refusal')) {
           errorMessage = "⚠️ Gambar ditolak oleh sistem keamanan AI.";
        } else if (errorMessage.includes('MISSING_KEYS')) {
           errorMessage = "⚠️ SETUP ERROR: API Key belum terbaca di Vercel.";
        }

        // Set global error state for the first error encountered, but don't break fully if it's just one image
        if (!error && !errorMessage.includes("Layanan Belum Aktif")) {
           setError(errorMessage);
           setDebugInfo({ keyHint, originalError });
        }

        // Mark this specific image as failed
        setImages(prev => prev.map(img => 
          img.id === currentImageId ? { ...img, error: errorMessage, isLoading: false } : img
        ));
      }
    }

    setIsGenerating(false);
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM_DATA);
    setImages([]);
    setError(null);
    setDebugInfo(null);
    setResetKey(prev => prev + 1); // Force re-render inputs
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <header className="glass sticky top-0 z-50 rounded-2xl mb-8 p-4 flex justify-between items-center max-w-7xl mx-auto backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
            <Heart className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              ibunnyaryu <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400">affiliate</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
               <span className="text-[10px] text-green-400 font-bold font-mono tracking-widest uppercase bg-green-900/30 px-2 py-0.5 rounded border border-green-500/30">
                 ✅ v4.FAST-FAIL (NO WAIT)
               </span>
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-1 glass rounded-full">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs font-bold text-gray-300">SYSTEM ONLINE</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <section className="lg:col-span-5 space-y-6">
          <GlassCard className="min-h-[600px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-pink-600/20 rounded-full blur-[100px] pointer-events-none"></div>
            
            <div className="relative z-10">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Settings2 className="text-pink-400 w-5 h-5" /> Konfigurasi
              </h2>

              <ModeSelector currentMode={mode} onSelectMode={setMode} />

              <PromptForm 
                key={resetKey}
                mode={mode} 
                formData={formData} 
                onChange={handleFormChange}
                onGenerate={handleGenerate}
                onReset={handleReset}
                isGenerating={isGenerating}
                error={null} // Handle error externally below
              />

              {/* Enhanced Error Display */}
              {error === "ACTIVATION_REQUIRED" ? (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl space-y-2 animate-pulse">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                     <Settings2 className="w-4 h-4" />
                     LAYANAN GOOGLE BELUM AKTIF
                  </div>
                  <p className="text-xs text-gray-300">
                    API Key valid, tapi layanan belum dinyalakan. Klik tombol di bawah:
                  </p>
                  <a 
                    href="https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    AKTIFKAN SEKARANG (ENABLE) <ExternalLink className="w-3 h-3" />
                  </a>
                  {debugInfo && (
                    <div className="pt-2 border-t border-red-500/20">
                      <p className="text-[10px] text-gray-500 font-mono">
                        Key: ...{debugInfo.keyHint} | Err: {debugInfo.originalError.slice(0, 50)}...
                      </p>
                    </div>
                  )}
                </div>
              ) : error && (
                <div className="mt-4 text-red-400 text-xs text-center bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                  <p className="font-bold mb-1">{error}</p>
                  {debugInfo && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-[10px] text-gray-500 hover:text-gray-300 underline">
                        Lihat Detail Teknis
                      </summary>
                      <div className="mt-2 text-left bg-black/30 p-2 rounded text-[10px] font-mono text-gray-400 whitespace-pre-wrap">
                        <p>Using Key: ...{debugInfo.keyHint}</p>
                        <p>Original Error: {debugInfo.originalError}</p>
                      </div>
                    </details>
                  )}
                </div>
              )}

            </div>
          </GlassCard>
        </section>

        <section className="lg:col-span-7">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live Gallery</h3>
            {images.length > 0 && !isGenerating && (
              <span className="text-[10px] px-2 py-1 bg-green-500/20 text-green-400 rounded border border-green-500/30">
                SELESAI
              </span>
            )}
          </div>

          <ImageGallery images={images} isGenerating={isGenerating} />
        </section>
      </main>
    </div>
  );
};

export default App;