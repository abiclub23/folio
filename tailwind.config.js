/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'custom': {
          'plum': '#825d73',
          'rose': '#c06370',
          'peach': '#fabc72',
          'sage': '#688a74',
          'periwinkle': '#7494de',
        }
      },
      fontFamily: {
        'switzer': ['Switzer', 'sans-serif'],
        
        'playwrite': ['Playwrite IT Moderna', 'cursive'],
      },
    },
  },
  plugins: [],
} 