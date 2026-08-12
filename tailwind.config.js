/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#08080b',
          900: '#0d0d12',
          850: '#12121a',
          800: '#171722',
          750: '#1d1d2a',
          700: '#252534',
          600: '#343446',
          500: '#4a4a60',
          400: '#6b6b85',
          300: '#9a9ab2',
          200: '#c5c5d6',
          100: '#e8e8f0',
        },
        amber: {
          DEFAULT: '#f0b429',
          soft: '#ffd77a',
          deep: '#8a6112',
        },
        signal: {
          ok: '#4ade80',
          warn: '#fbbf24',
          bad: '#f87171',
          info: '#7dd3fc',
        },
      },
      fontFamily: {
        display: ['"Iowan Old Style"', '"Palatino Linotype"', 'Palatino', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"SFMono-Regular"', 'Menlo', 'Consolas', '"Liberation Mono"', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 20px 40px -24px rgba(0,0,0,0.9)',
      },
    },
  },
  plugins: [],
}
