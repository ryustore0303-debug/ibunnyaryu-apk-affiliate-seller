import React, { useState } from 'react';
import { Heart, Settings2 } from 'lucide-react';
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

    // Execute 4 parallel requests
    const promises = newImages.map(async (imgPlaceholder, index) => {
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

        // Pass the prompt AND the product image ARRAY and optional ref/logo/face images to the service
        const url = await generateImagenImage(promptText, formData.productImages, refImage, logoImage, faceImage);
        return { ...imgPlaceholder, url, isLoading: false };
      } catch (err: any) {
        console.error(err);
        // CRITICAL: Capture the REAL error message here
        let errorMessage = err?.message || 'Gagal Memuat';
        
        // Specific Error Parsing
        // Check for "Precondition check failed" or "service not enabled"
        if (errorMessage.includes('limit: 0') || errorMessage.includes('Precondition') || errorMessage.includes('Not Found') || errorMessage.includes('404')) {
           errorMessage = "⚠️ LAYANAN BELUM AKTIF. Anda harus mengaktifkan 'Generative Language API' di Google Cloud Console untuk Project Anda.";
        } else if (errorMessage.includes('429') || errorMessage.includes('Quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
           errorMessage = "⚠️ Limit Kuota Habis (429). Sistem sedang sibuk, silakan coba beberapa saat lagi.";
        } else if (errorMessage.includes('Refusal')) {
           errorMessage = "⚠️ Gambar ditolak oleh sistem keamanan AI (Safety Filter). Coba ganti prompt atau gambar.";
        } else if (errorMessage.includes('MISSING_KEYS')) {
           errorMessage = "⚠️ SETUP ERROR: API Key belum terbaca. Pastikan Environment Variable 'VITE_API_KEY' sudah ada di Vercel.";
        }

        return { ...imgPlaceholder, error: errorMessage, isLoading: false };
      }
    });

    const resolvedImages = await Promise.all(promises);
    setImages(resolvedImages);
    setIsGenerating(false);
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM_DATA);
    setImages([]);
    setError(null);
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
                 ✅ V9.0 (STABILITY FIX)
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
                error={error}
              />
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