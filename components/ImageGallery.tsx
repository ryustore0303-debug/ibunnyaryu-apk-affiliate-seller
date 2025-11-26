import React from 'react';
import { GeneratedImage } from '../types';
import { Image as ImageIcon, Loader, Download } from 'lucide-react';

interface ImageGalleryProps {
  images: GeneratedImage[];
  isGenerating: boolean;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, isGenerating }) => {
  // If we have no images and are not generating, show empty state
  if (images.length === 0 && !isGenerating) {
    return (
      <div className="h-full w-full">
        <div className="h-64 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-gray-500">
          <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
          <p className="text-sm font-bold">Siap Berkarya</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 pb-20 fade-in">
      {images.map((img, index) => (
        <div key={img.id} className="relative w-full aspect-square md:aspect-[4/3] group">
          {img.isLoading ? (
            <div className="w-full h-full bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center justify-center animate-pulse">
              <Loader className="text-pink-400 animate-spin mb-2" />
              <span className="text-[10px] text-gray-500">Antrian #{index + 1}</span>
            </div>
          ) : img.error ? (
            <div className="w-full h-full bg-red-500/5 rounded-2xl border border-red-500/20 flex flex-col items-center justify-center p-4 text-center overflow-auto">
              <span className="text-xs text-red-400 font-bold mb-1">Gagal Memuat</span>
              <span className="text-[10px] text-red-300/70">{img.error}</span>
            </div>
          ) : (
            <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-lg">
              <img src={img.url} alt={`Result ${index + 1}`} className="w-full h-full object-cover" />
              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <a 
                  href={img.url} 
                  download={`generated-image-${index}.jpg`}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-colors"
                >
                  <Download className="w-5 h-5 text-white" />
                </a>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ImageGallery;