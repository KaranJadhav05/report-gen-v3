/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      colors: {
        bg: {
          DEFAULT: '#0a0f1e',
          2:       '#0f172a',
          3:       '#1e293b',
          4:       '#263348',
        },
        surface: {
          DEFAULT: '#1e293b',
          2:       '#263348',
          3:       '#2d3f5c',
        },
        brand: {
          DEFAULT: '#6366f1',
          dim:     '#4f46e5',
          glow:    'rgba(99,102,241,0.35)',
          50:      'rgba(99,102,241,0.08)',
          100:     'rgba(99,102,241,0.15)',
        },
        accent: {
          DEFAULT: '#06b6d4',
          glow:    'rgba(6,182,212,0.3)',
        },
        emerald: { glow: 'rgba(16,185,129,0.3)' },
        rose:    { glow: 'rgba(244,63,94,0.3)'  },
        amber:   { glow: 'rgba(245,158,11,0.3)' },
      },
      borderColor: { DEFAULT: 'rgba(148,163,184,0.12)' },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(99,102,241,0.35), 0 0 40px rgba(99,102,241,0.1)',
        'glow-accent':  '0 0 20px rgba(6,182,212,0.3)',
        'glow-success': '0 0 20px rgba(16,185,129,0.3)',
        'glow-danger':  '0 0 20px rgba(244,63,94,0.3)',
        'card':         '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover':   '0 8px 40px rgba(0,0,0,0.5)',
        'deep':         '0 20px 60px rgba(0,0,0,0.6)',
      },
      backdropBlur: { xs: '4px' },
      animation: {
        'fade-in-up':  'fadeInUp 0.4s ease both',
        'pulse-glow':  'pulseGlow 2.5s ease-in-out infinite',
        'shimmer':     'shimmer 1.5s infinite',
        'float':       'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%,100%': { boxShadow: '0 0 8px rgba(99,102,241,0.35)' },
          '50%':     { boxShadow: '0 0 24px rgba(99,102,241,0.5), 0 0 48px rgba(99,102,241,0.15)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition:  '200% center' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
};
