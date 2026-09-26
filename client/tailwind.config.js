/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#09090b',
        surface: '#121214',
        surfaceHover: '#18181b',
        borderMuted: '#27272a',
        textMuted: '#a1a1aa',
        accentWhite: '#ffffff',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow-white': '0 0 25px -5px rgba(255, 255, 255, 0.15)',
        'modal-dark': '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
      },
    },
  },
  plugins: [],
}
