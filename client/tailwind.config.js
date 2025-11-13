/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        matrix: {
          50: '#e6ffe6',
          100: '#b3ffb3',
          200: '#80ff80',
          300: '#4dff4d',
          400: '#1aff1a',
          500: '#00ff00',
          600: '#00cc00',
          700: '#009900',
          800: '#006600',
          900: '#003300',
        },
        cyber: {
          dark: '#0a0e0f',
          darker: '#050708',
          gray: '#1a2328',
          light: '#2d3a42'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #00ff00, 0 0 10px #00ff00' },
          '100%': { boxShadow: '0 0 10px #00ff00, 0 0 20px #00ff00, 0 0 30px #00ff00' }
        }
      }
    },
  },
  plugins: [],
}