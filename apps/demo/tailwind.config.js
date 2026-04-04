/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        aurum: {
          gold:      '#C9A84C',
          'gold-light': '#E8C97A',
          'gold-dark':  '#A07830',
          midnight:  '#1C1F2E',
          'midnight-light': '#2D3148',
          ivory:     '#FAF8F4',
          'ivory-dark': '#F0EBE3',
          terracotta: '#C4622D',
        },
        // keep cyan for RainbowKit
        cyan: { 400: '#00e5ff', 500: '#00d4f0', 300: '#67f0ff' },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        gold: '0 4px 24px rgba(201,168,76,0.25)',
        card: '0 2px 16px rgba(28,31,46,0.08)',
      },
    },
  },
  plugins: [],
};
