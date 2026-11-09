/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/renderer/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        vault: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          dark: '#0B0F17',
          surface: '#111827',
          border: '#1F2937',
          card: '#182234',
          accent: '#10B981',
          gold: '#F59E0B'
        }
      },
      fontFamily: {
        sans: ['Tajawal', 'Cairo', 'Segoe UI', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
