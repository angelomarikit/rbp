/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        rbp: {
          bg: '#000000',
          surface: '#070707',
          card: '#0b0b0b',
          accent: '#FF7900',
          'accent-bright': '#ff9a1a',
          'accent-gold': '#FF7900',
          border: '#c56a00',
          'border-light': '#FF7900',
          divider: '#FF7900',
          text: '#FFFFFF',
          muted: '#F5E6D3',
          cream: '#F5E6D3',
          pierce: '#F5E6D3',
        },
      },
      fontFamily: {
        display: ['var(--rbp-font-display)'],
        body: ['var(--rbp-font-body)'],
      },
      borderRadius: {
        rbp: '7px',
      },
    },
  },
  plugins: [],
}