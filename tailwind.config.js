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
      fontFamily: {
        'switzer': ['Switzer', 'sans-serif'],
        'playwrite': ['Playwrite IT Moderna', 'cursive'],
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
