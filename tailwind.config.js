/** @type {import('tailwindcss').Config} */
const colors = {
  kraft: '#D4BC96',
  ink: {
    DEFAULT: '#333333', // primary: headings, body
    soft: '#4A4237',    // secondary: intros, descriptions
    muted: '#564B3B',   // tertiary: dates, timestamps, captions
  },
  olive: '#3D5C2E',
};

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors,
      // Roadster game: phone icon turning sideways on the rotate prompt
      keyframes: {
        'turn-phone': {
          '0%, 25%': { transform: 'rotate(0deg)' },
          '50%, 85%': { transform: 'rotate(90deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
      },
      animation: {
        'turn-phone': 'turn-phone 2.4s ease-in-out infinite',
      },
      fontFamily: {
        'switzer': ['Switzer', 'sans-serif'],
        'playwrite': ['Playwrite IT Moderna', 'cursive'],
        'barlow': ['Barlow', 'system-ui', 'sans-serif'],
        'barlow-condensed': ['Barlow Condensed', 'Arial Narrow', 'system-ui', 'sans-serif'],
        'saira': ['Saira', 'system-ui', 'sans-serif'],
        'saira-condensed': ['Saira Condensed', 'Arial Narrow', 'system-ui', 'sans-serif'],
      },
      // Replace the typography plugin's cool-gray defaults with the warm palette
      typography: {
        DEFAULT: {
          css: {
            '--tw-prose-body': colors.ink.DEFAULT,
            '--tw-prose-headings': colors.ink.DEFAULT,
            '--tw-prose-lead': colors.ink.soft,
            '--tw-prose-links': colors.ink.DEFAULT,
            '--tw-prose-bold': colors.ink.DEFAULT,
            '--tw-prose-counters': colors.ink.soft,
            '--tw-prose-bullets': colors.ink.soft,
            '--tw-prose-hr': colors.ink.DEFAULT,
            '--tw-prose-quotes': colors.ink.DEFAULT,
            '--tw-prose-quote-borders': colors.ink.muted,
            '--tw-prose-captions': colors.ink.muted,
            '--tw-prose-code': colors.ink.DEFAULT,
            '--tw-prose-th-borders': colors.ink.muted,
            '--tw-prose-td-borders': colors.ink.muted,
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
