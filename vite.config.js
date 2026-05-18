import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api': {
                target: 'https://resume-analyzer-api-4gpv.onrender.com',
                changeOrigin: true,
            },
        },
    },
})
