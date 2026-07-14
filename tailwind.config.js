/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f3f1ff', 100: '#e9e5ff', 200: '#d5cdff', 300: '#b7a5ff',
          400: '#9575ff', 500: '#7c4dff', 600: '#6d28f9', 700: '#5d18e4',
          800: '#4e15bf', 900: '#41139c', 950: '#26066a',
        },
      },
      boxShadow: {
        glow: '0 0 24px -6px rgba(124, 77, 255, 0.45)',
        card: '0 1px 2px rgba(0,0,0,0.06), 0 8px 24px -12px rgba(0,0,0,0.25)',
      },
      keyframes: {
        'fade-up': { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        'pop-in': { '0%': { opacity: 0, transform: 'scale(.92)' }, '70%': { transform: 'scale(1.03)' }, '100%': { opacity: 1, transform: 'scale(1)' } },
        'slide-in': { from: { opacity: 0, transform: 'translateX(24px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        flame: { '0%,100%': { transform: 'scale(1) rotate(-2deg)' }, '50%': { transform: 'scale(1.15) rotate(3deg)' } },
        'pulse-soft': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.55 } },
        shimmer: { from: { backgroundPosition: '200% 0' }, to: { backgroundPosition: '-200% 0' } },
        floaty: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
      },
      animation: {
        'fade-up': 'fade-up .45s ease both',
        'pop-in': 'pop-in .35s ease both',
        'slide-in': 'slide-in .3s ease both',
        flame: 'flame 1.6s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        floaty: 'floaty 3.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
