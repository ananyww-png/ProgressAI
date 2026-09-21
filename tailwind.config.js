/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#0b0b0b', 2: '#52514e', 3: '#898781' },
        line: '#e4e3dd',
        plane: '#f6f6f3',
        brand: { DEFAULT: '#2a78d6', dark: '#1c5cab', soft: '#e8f1fc' },
        good: '#0ca30c',
        warn: '#fab219',
        serious: '#ec835a',
        critical: '#d03b3b',
      },
      fontFamily: { sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'] },
    },
  },
  plugins: [],
};
