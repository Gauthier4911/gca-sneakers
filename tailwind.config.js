/** Charte GCA sneakers — voir README §5 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: { DEFAULT: '#053B2C', 900: '#032A1F', 800: '#053B2C', 700: '#0A4D3A' },
        emerald: { DEFAULT: '#047857', 600: '#059669', 700: '#047857', 800: '#065F46' },
        mint: { DEFAULT: '#34D399', light: '#ECFDF5' },
        gold: { DEFAULT: '#FFB800', light: '#FFE08A' },
        mango: { DEFAULT: '#FF7A00' },
        amber: { DEFAULT: '#B45309' },
        cream: { DEFAULT: '#FFF8E7' },
        ink: { DEFAULT: '#053B2C', soft: '#3F5A50' },
      },
      fontFamily: {
        display: ['Lexend', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        signature: 'linear-gradient(90deg, #FFB800 0%, #FF7A00 100%)',
      },
      boxShadow: {
        card: '0 10px 30px -12px rgba(5, 59, 44, 0.25)',
        glow: '0 10px 30px -8px rgba(255, 138, 0, 0.55)',
      },
      borderRadius: { xl2: '1.25rem' },
    },
  },
  plugins: [],
};
