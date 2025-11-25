export enum AppMode {
  POV = 'pov',
  PRODUK = 'produk',
  MODEL = 'model'
}

export interface FormData {
  productImages: File[]; // Changed from single File to File array
  bgReferenceImage?: File | null;
  logoImage?: File | null;
  bgDesc?: string;
  lighting?: string;
  ambience?: string;
  location?: string;
  faceImage?: File | null;
  modelType?: string;
  ageRange?: string;
  visualStyle?: string;
  gender?: string;
  hijab?: string;
}

export interface GeneratedImage {
  id: string;
  url: string;
  isLoading: boolean;
  error?: string;
}

export interface ModeConfig {
  id: AppMode;
  label: string;
  icon: string;
}