import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Racine du domaine : le site est servi depuis « / » sur Netlify, et des
  // chemins absolus restent valides meme quand le repli SPA sert index.html
  // sur une URL imbriquee — ce que des chemins relatifs casseraient.
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
