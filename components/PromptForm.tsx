import React from 'react';
import { AppMode, FormData } from '../types';
import { GENDERS, HIJAB_OPTIONS, LIGHTING_OPTIONS, AMBIENCE_OPTIONS, LOCATION_OPTIONS, MODEL_TYPES, VISUAL_STYLES } from '../constants';
import { Sparkles, Loader2, RotateCcw, X, FileImage } from 'lucide-react';

interface PromptFormProps {
  mode: AppMode;
  formData: FormData;
  onChange: (field: keyof FormData, value: any) => void;
  onGenerate: () => void;
  onReset: () => void;
  isGenerating: boolean;
  error?: string | null;
}

const PromptForm: React.FC<PromptFormProps> = ({ 
  mode, 
  formData, 
  onChange, 
  onGenerate, 
  onReset,
  isGenerating,
  error 
}) => {
  
  // Handle Main Product Images (Array)
  const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      
      if (mode === AppMode.MODEL) {
        // Mode Model: APPEND / AKUMULASI (Max 3)
        const currentFiles = formData.productImages || [];
        const combinedFiles = [...currentFiles, ...newFiles];
        
        if (combinedFiles.length > 3) {
          alert("Maksimal total 3 gambar produk untuk Mode Model.");
          // Ambil 3 pertama saja
          onChange('productImages', combinedFiles.slice(0, 3));
        } else {
          onChange('productImages', combinedFiles);
        }
      } else {
        // Mode Lain: REPLACE (Max 1)
        onChange('productImages', [newFiles[0]]);
      }
      
      // Reset value agar bisa select file yang sama jika perlu
      e.target.value = '';
    }
  };

  const removeProductImage = (indexToRemove: number) => {
    const updatedFiles = formData.productImages.filter((_, index) => index !== indexToRemove);
    onChange('productImages', updatedFiles);
  };

  // Handle Single Helper Images
  const handleSingleFileChange = (field: keyof FormData, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onChange(field, e.target.files[0]);
    }
  };

  return (
    <div className="space-y-4 fade-in">
      {/* Universal Product Input */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400 font-bold ml-1 flex justify-between">
          <span>
            Upload Produk {mode === AppMode.MODEL ? '(Max 3)' : '(Wajib)'}
          </span>
          <span className="text-pink-400">
            {formData.productImages.length} / {mode === AppMode.MODEL ? 3 : 1}
          </span>
        </label>
        
        <div className="relative">
          <input 
            type="file" 
            accept="image/*"
            multiple={mode === AppMode.MODEL} // Hanya multiple di mode Model
            onChange={handleProductImageChange}
            className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-pink-500/10 file:text-pink-400 hover:file:bg-pink-500/20 cursor-pointer"
          />
        </div>

        {/* List Preview File Terpilih */}
        {formData.productImages.length > 0 && (
          <div className="grid gap-2 mt-2">
            {formData.productImages.map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex items-center justify-between bg-white/5 border border-white/10 p-2 rounded-lg">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center flex-shrink-0">
                    <FileImage className="w-4 h-4 text-gray-400" />
                  </div>
                  <span className="text-xs text-gray-300 truncate">{file.name}</span>
                </div>
                <button 
                  onClick={() => removeProductImage(index)}
                  className="p-1 hover:bg-red-500/20 rounded-full text-gray-500 hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <hr className="border-white/10 my-4" />

      {/* Mode Specific Inputs */}
      {mode === AppMode.POV && (
        <>
           <div className="space-y-1">
            <label className="text-xs text-gray-400 font-bold ml-1">Referensi Background (Opsional)</label>
            <div className="relative">
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => handleSingleFileChange('bgReferenceImage', e)}
                className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-violet-500/10 file:text-violet-400 hover:file:bg-violet-500/20 cursor-pointer"
              />
              <p className="text-[10px] text-gray-500 mt-1 ml-1">
                Jika diisi, salah satu hasil akan menggunakan background ini.
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400 font-bold ml-1">Deskripsi Tambahan (Opsional)</label>
            <input 
              type="text" 
              placeholder="Meja putih estetik, ada bunga tulip..."
              value={formData.bgDesc || ''}
              onChange={(e) => onChange('bgDesc', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-pink-500 text-white placeholder-gray-500"
            />
          </div>
        </>
      )}

      {mode === AppMode.PRODUK && (
        <>
          <div className="space-y-1">
            <label className="text-xs text-gray-400 font-bold ml-1">Logo Brand (Opsional)</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => handleSingleFileChange('logoImage', e)}
              className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-pink-500/10 file:text-pink-400 hover:file:bg-pink-500/20 cursor-pointer"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-bold ml-1">Pencahayaan</label>
              <select 
                value={formData.lighting || LIGHTING_OPTIONS[0]}
                onChange={(e) => onChange('lighting', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-pink-500 text-white"
              >
                {LIGHTING_OPTIONS.map(s => <option key={s} value={s} className="text-black">{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-bold ml-1">Lokasi</label>
              <select 
                value={formData.location || LOCATION_OPTIONS[0]}
                onChange={(e) => onChange('location', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-pink-500 text-white"
              >
                {LOCATION_OPTIONS.map(s => <option key={s} value={s} className="text-black">{s}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400 font-bold ml-1">Suasana</label>
            <select 
              value={formData.ambience || AMBIENCE_OPTIONS[0]}
              onChange={(e) => onChange('ambience', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-pink-500 text-white"
            >
              {AMBIENCE_OPTIONS.map(s => <option key={s} value={s} className="text-black">{s}</option>)}
            </select>
          </div>
        </>
      )}

      {mode === AppMode.MODEL && (
        <>
          <div className="space-y-1">
            <label className="text-xs text-gray-400 font-bold ml-1">Tipe Model (Wajib)</label>
            <select 
              value={formData.modelType || MODEL_TYPES[0]}
              onChange={(e) => onChange('modelType', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-pink-500 text-white"
            >
              {MODEL_TYPES.map(s => <option key={s} value={s} className="text-black">{s}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-400 font-bold ml-1">Wajah Model (Opsional)</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => handleSingleFileChange('faceImage', e)}
              className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-pink-500/10 file:text-pink-400 hover:file:bg-pink-500/20 cursor-pointer"
            />
            <p className="text-[10px] text-gray-500 ml-1">Jika diisi, wajah hasil generate akan mirip dengan foto ini.</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-bold ml-1">Gender</label>
              <select 
                value={formData.gender || GENDERS[0]}
                onChange={(e) => onChange('gender', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-pink-500 text-white"
              >
                {GENDERS.map(s => <option key={s} value={s} className="text-black">{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-bold ml-1">Usia / Umur</label>
              <input 
                type="text"
                value={formData.ageRange || ''}
                onChange={(e) => onChange('ageRange', e.target.value)}
                placeholder="Cth: 8 tahun, 25 tahun..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-pink-500 text-white placeholder-gray-500"
              />
            </div>
          </div>

          {formData.gender !== 'Pria' && (
             <div className="space-y-1">
             <label className="text-xs text-gray-400 font-bold ml-1">Opsi Hijab</label>
             <select 
               value={formData.hijab || HIJAB_OPTIONS[0]}
               onChange={(e) => onChange('hijab', e.target.value)}
               className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-pink-500 text-white"
             >
               {HIJAB_OPTIONS.map(s => <option key={s} value={s} className="text-black">{s}</option>)}
             </select>
           </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-bold ml-1">Lokasi</label>
              <select 
                value={formData.location || LOCATION_OPTIONS[0]}
                onChange={(e) => onChange('location', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-pink-500 text-white"
              >
                {LOCATION_OPTIONS.map(s => <option key={s} value={s} className="text-black">{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-bold ml-1">Gaya Visual</label>
              <select 
                value={formData.visualStyle || VISUAL_STYLES[0]}
                onChange={(e) => onChange('visualStyle', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-pink-500 text-white"
              >
                {VISUAL_STYLES.map(s => <option key={s} value={s} className="text-black">{s}</option>)}
              </select>
            </div>
          </div>
        </>
      )}

      <div className="flex flex-col gap-3 mt-8">
        <button 
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full py-4 bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-white shadow-lg shadow-pink-900/50 transition-all flex justify-center items-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>MEMPROSES 4 GAMBAR...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>GENERATE 4 GAMBAR</span>
            </>
          )}
        </button>

        <button 
          onClick={onReset}
          disabled={isGenerating}
          className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl font-bold text-gray-400 hover:text-white transition-all flex justify-center items-center gap-2 text-xs"
        >
          <RotateCcw className="w-4 h-4" />
          RESET KONFIGURASI
        </button>
      </div>

      {error && (
        <div className="text-red-400 text-xs mt-2 text-center bg-red-500/10 p-2 rounded-lg border border-red-500/20">
          {error}
        </div>
      )}
    </div>
  );
};

export default PromptForm;