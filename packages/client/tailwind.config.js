/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gamehub: {
          bg: '#0B0C10',
          surface: '#13141B',
          card: 'rgba(255, 255, 255, 0.04)',
          cardHover: 'rgba(255, 255, 255, 0.08)',
          border: 'rgba(255, 255, 255, 0.08)',
          borderGlow: 'rgba(255, 255, 255, 0.60)',
          cyan: '#56D8FF',
          gold: '#FFB800',
          orange: '#FF7A00',
          green: '#27C93F',
          red: '#FF4D4F'
        }
      },
      fontFamily: {
        sans: [
          'D-DIN PRO',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif'
        ]
      },
      transitionTimingFunction: {
        'apple-out': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'apple-spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      },
      boxShadow: {
        glow: '0 0 24px rgba(255, 255, 255, 0.25)',
        halo: '0 0 0 2px #FFFFFF, 0 0 20px rgba(255, 255, 255, 0.3)',
        'cyan-glow': '0 0 20px rgba(86, 216, 255, 0.35)',
        'gold-glow': '0 0 24px rgba(255, 184, 0, 0.4)'
      }
    }
  },
  plugins: []
};
