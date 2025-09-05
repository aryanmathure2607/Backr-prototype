/** @type {import('tailwindcss').Config} */
import { fontFamily } from 'tailwindcss/defaultTheme';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      backgroundImage: {
        'grid-pattern': "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='%232C3149'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e\")",
      },
      colors: {
        dark: {
          '100': '#0D0F18', // Midnight Blue/Black
          '200': '#1A1D2E',
          '300': '#2C3149',
        },
        light: {
          '100': '#FFFFFF',
          '200': '#F1F5F9',
          '300': '#E2E8F0',
        },
        primary: {
          DEFAULT: '#8A3FFC', // Electric Purple
          hover: '#9B51E0',
        },
        secondary: {
          DEFAULT: '#00F5D4', // Mint Green
          hover: '#00D8B8',
        },
        accent: '#FF4081',
      },
      fontFamily: {
        sans: ["Inter", ...fontFamily.sans],
      },
      keyframes: {
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px #8A3FFC, 0 0 10px #8A3FFC' },
          '50%': { boxShadow: '0 0 20px #8A3FFC, 0 0 30px #8A3FFC' },
        }
      },
      animation: {
        glow: 'glow 2s ease-in-out infinite',
      }
    },
  },
  plugins: [],
};
