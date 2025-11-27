import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, '.', '');
  
  // Prioritize API_KEY, fallback to VITE_API_KEY, fallback to empty string
  const finalApiKey = env.API_KEY || env.VITE_API_KEY || '';
  
  return {
    plugins: [react()],
    define: {
      // PENTING: Ini menyuntikkan variable environment dari server/build ke client browser
      // Menggunakan JSON.stringify untuk memastikan nilai string yang valid atau "undefined" string
      'process.env.API_KEY': JSON.stringify(finalApiKey)
    }
  }
})