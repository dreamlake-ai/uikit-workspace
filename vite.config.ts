import { defineConfig } from 'vite'
import vike from 'vike/plugin'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vike(), tailwindcss()],
})
