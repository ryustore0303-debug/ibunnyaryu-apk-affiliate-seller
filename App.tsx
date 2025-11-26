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
           // Main Instruction - Hyper Realism Focus
           promptText += "Professional High-End Fashion Photography. ";
           
           // Pose and Background Variation for this specific index
           const specificPose = randomModelPoses[index];
           const specificBg = randomModelBackgrounds[index];

           if (formData.productImages.length > 1) {
              promptText += `Task: Create a seamless and cohesive composition featuring ALL ${formData.productImages.length} uploaded products. The products should be worn, held, or interacting with the model in a natural way. `;
           } else {
              promptText += "Task: The model is interacting with the uploaded product naturally. ";
           }

           // ANTI-CUTOUT / REALISM INSTRUCTIONS
           promptText += "CRITICAL: The product must be PHYSICALLY INTEGRATED into the scene. It must react to the environment's lighting, casting accurate shadows on the model's body and receiving shadows from the model. If the product is clothing, it must drape, fold, and stretch realistically over the body. If held, the hands must show weight distribution and realistic grip pressure. NO 'sticker' or 'cutout' effect. The grain, resolution, and color grading of the product must perfectly match the model. ";

           // Pose & Framing
           promptText += `Pose & Action: ${specificPose} The model's pose must complement the product. Framing: Full body or 3/4 shot (do not cut off head). `;
           
           // Visual Style & Location & Background
           promptText += `Visual Style: ${formData.visualStyle} aesthetic. Location: ${formData.location}. Background Details: ${specificBg} `;

           // Model Definition
           if (formData.modelType === 'Manekin Kain') {
             promptText += "Subject: A high-quality flexible cloth mannequin (ghost mannequin style but with form). The mannequin should have a fabric texture body, no realistic human skin, but posable and fluid like a human. ";
           } else {
             // Use manual input for age, fallback to 'young adult' if somehow empty
             const ageDesc = formData.ageRange ? formData.ageRange : 'young adult';
             
             promptText += `Subject: A realistic ${formData.gender} model, approximate age: ${ageDesc}. `;
             
             // Hijab logic
             if (formData.gender !== 'Pria' && formData.hijab && formData.hijab !== 'Non Hijab') {
               promptText += `Model is wearing a ${formData.hijab} that matches the outfit style. `;
             } else if (formData.gender !== 'Pria') {
                promptText += "Model is not wearing a hijab. Hair styled naturally. ";
             }
           }

           // Face Logic (Critical)
           if (formData.faceImage) {
             promptText += "FACE SWAP REQUIREMENT: The model's face MUST match the provided reference face image exactly. Perform a seamless high-quality face swap/integration. Match skin tone, lighting angle, and facial expression to the pose. The head-to-body connection must be flawless.";
             faceImage = formData.faceImage;
           } else if (formData.modelType === 'Manusia Asli') {
             promptText += "Model should have a naturally beautiful, Indonesian look with realistic skin texture. ";
           }

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
        if (errorMessage.includes('limit: 0')) {
           errorMessage = "⚠️ LAYANAN BELUM AKTIF. Anda harus mengaktifkan 'Generative Language API' di Google Cloud Console untuk Project Anda.";
        } else if (errorMessage.includes('429') || errorMessage.includes('Quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
           // Fixed generic message
           errorMessage = "Limit Kuota Habis (429). API Key Anda sedang sibuk. Coba lagi beberapa saat.";
        }
        
        return { ...imgPlaceholder, isLoading: false, error: errorMessage };
      }
    });

    try {
      const results = await Promise.all(promises);
      setImages(results);
    } catch (e) {
      console.error(e);
      setError("Terjadi kesalahan saat memproses gambar.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM_DATA);
    setImages([]);
    setError(null);
    setResetKey(prev => prev + 1); // Increment key to force re-render of PromptForm (clearing file inputs)
  };

  return (
    <div className="max-w-7xl mx-auto md:p-8 p-4">
      {/* Header */}
      <header className="glass sticky top-0 z-50 rounded-2xl mb-8 p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
            <Heart className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              ibunnyaryu <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400">affiliate</span>
            </h1>
            <p className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">PRO ENGINE • V.FINAL</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-1 glass rounded-full">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs font-bold text-gray-300">SYSTEM ONLINE</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Config */}
        <section className="lg:col-span-5 space-y-6">
          <GlassCard className="relative">
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

        {/* Right Column: Gallery */}
        <section className="lg:col-span-7">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live Gallery</h3>
            {!isGenerating && images.length > 0 && (
              <span className="text-[10px] px-2 py-1 bg-green-500/20 text-green-400 rounded border border-green-500/30">SELESAI</span>
            )}
          </div>

          <div className="max-h-[800px] overflow-y-auto custom-scrollbar pr-2">
            <ImageGallery images={images} isGenerating={isGenerating} />
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;