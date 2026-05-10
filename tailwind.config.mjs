/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#098058',
          dim:     '#076949',
          bright:  '#0BAF74',
          glow:    '#10C882',
          subtle:  'rgba(9,128,88,0.10)',
          border:  'rgba(9,128,88,0.25)',
        },
        base: {
          950: '#F8FAFB',
          900: '#F1F4F5',
          850: '#E8ECEE',
          800: '#DDE3E6',
          750: '#CDD5D9',
          700: '#B8C3C8',
          600: '#96A6AE',
          500: '#6B7E87',
          400: '#4A5D66',
          300: '#334752',
          200: '#1E303A',
          100: '#0F1E25',
          50:  '#060E12',
        },
        text: {
          primary:   '#0F1E25',
          secondary: '#4A5D66',
          muted:     '#6B7E87',
          faint:     '#96A6AE',
        },
      },
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        sans:    ['"DM Sans"', 'sans-serif'],
      },
      letterSpacing: {
        display: '-0.04em',
        tight:   '-0.02em',
        snug:    '-0.01em',
      },
      borderRadius: {
        card:  '12px',
        panel: '16px',
      },
      boxShadow: {
        'card':        '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover':  '0 4px 20px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
        'glass':       '0 2px 12px rgba(0,0,0,0.07), 0 1px 0 rgba(255,255,255,0.80) inset',
        'glass-hover': '0 6px 28px rgba(0,0,0,0.12)',
        'accent-glow': '0 0 16px rgba(9,128,88,0.20)',
        'accent-ring': '0 0 0 3px rgba(9,128,88,0.15)',
        'input':       '0 0 0 3px rgba(9,128,88,0.14)',
        'nav-active':  '0 2px 8px rgba(9,128,88,0.16)',
        'overlay':     '0 20px 60px rgba(0,0,0,0.20)',
      },
      animation: {
        'fade-in':   'fadeIn 0.35s ease-out both',
        'slide-up':  'slideUp 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in':  'scaleIn 0.3s cubic-bezier(0.16,1,0.3,1) both',
        'spin-slow': 'spin 1.2s linear infinite',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:   { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:  { '0%': { transform: 'translateY(16px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        scaleIn:  { '0%': { transform: 'scale(0.96)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        pulseDot: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.35' } },
      },
    },
  },
  plugins: [],
};
