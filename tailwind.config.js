/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        kraft: '#D4BC96',
        ink: '#333333',
        olive: '#3D5C2E',
      },
      fontFamily: {
        'switzer': ['Switzer', 'sans-serif'],
        'playwrite': ['Playwrite IT Moderna', 'cursive'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
