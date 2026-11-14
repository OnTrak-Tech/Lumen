/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/overlay/public/**/*.{html,js}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fbf8ea',
          100: '#f4edc9',
          500: '#d4af37', // Gold / Lumen accent
          600: '#b89428',
          700: '#8c6d1a'
        }
      }
    },
  },
  plugins: [],
}
