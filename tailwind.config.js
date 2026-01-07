/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cream': '#FFFBF0',
        'kot-orange': '#FF6600',
        'kot-dark': '#2C2C2C'
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
      },
      borderRadius: {
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
