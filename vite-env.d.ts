// /// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Ensure process.env.API_KEY is typed as string globally for TS
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
  }
}
