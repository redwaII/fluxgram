/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        tg: {
          bg: '#0e1621',
          panel: '#17212b',
          hover: '#202b36',
          border: '#0f1419',
          accent: '#5288c1',
          accentHover: '#6b9fd4',
          text: '#f5f5f5',
          muted: '#7d8b99',
          bubbleOut: '#2b5278',
          bubbleIn: '#182533',
          online: '#4dcd5e',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.2s infinite',
        fadeIn: 'fadeIn 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
