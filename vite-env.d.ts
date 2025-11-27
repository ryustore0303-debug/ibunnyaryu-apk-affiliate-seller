// Removed reference to vite/client to fix "Cannot find type definition file" error
// /// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_KEYS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Fix "Cannot redeclare block-scoped variable 'process'" and type mismatch errors.
// Instead of redeclaring the global 'process' variable, we augment the NodeJS namespace
// to add the API_KEY property to ProcessEnv.
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
  }
}
