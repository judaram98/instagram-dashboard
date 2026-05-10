/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#098058',
          50:  '#E6F7F0',
          100: '#C0EAD9',
          200: '#82D5B3',
          300: '#43C08D',
          400: '#1BA86B',
          500: '#098058',
          600: '#076949',
          700: '#05523B',
          800: '#033B2B',
          900: '#02251A',
        },
        emerald: {
          deep:  '#0A2E25',
          glass: '#098058',
        },
        surface: '#0A2E25',
        card:    '#FFFFFF',
        ink:     '#1A2332',
        'ink-muted': '#64748B',
        'ink-faint': '#CBD5E1',
      },
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        sans:    ['"DM Sans"', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
      },
      boxShadow: {
        card:       '0 1px 2px rgba(0,0,0,0.04), 0 3px 10px rgba(0,0,0,0.06)',
        'card-hover':'0 4px 16px rgba(0,0,0,0.10), 0 8px 24px rgba(0,0,0,0.08)',
        input:      '0 0 0 3px rgba(9,128,88,0.18)',
      },
      animation: {
        'fade-in':  'fadeIn 0.35s ease-out both',
        'slide-up': 'slideUp 0.4s ease-out both',
        'spin-slow':'spin 1.2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(18px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
