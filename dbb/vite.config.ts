// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api': {
                target: 'https://bot-ir83.onrender.com/', // Your Express server
                changeOrigin: true,
                secure: false,
            },
        },
    },
});