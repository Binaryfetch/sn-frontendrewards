/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f7f8fc',
          100: '#edf0f9',
          200: '#d7dceb',
          300: '#b9c1d5',
          400: '#8e98b4',
          500: '#5f6f91',
          600: '#4a5876',
          700: '#3b455d',
          800: '#232939',
          900: '#10131d',
        },
        accent: {
          50: '#fff9ef',
          100: '#fef2dc',
          200: '#fbe1b0',
          300: '#f6c777',
          400: '#efac44',
          500: '#d9952f',
          600: '#b6711f',
          700: '#8d4f16',
          800: '#653810',
          900: '#3f230a',
        },
        graphite: {
          50: '#f6f7f8',
          100: '#edefef',
          200: '#d4d8d9',
          300: '#b1b8bb',
          400: '#889098',
          500: '#6c737c',
          600: '#555a63',
          700: '#43464d',
          800: '#2b2d31',
          900: '#121316',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'float': 'float 4s ease-in-out infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        float: {
          '0%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
          '100%': { transform: 'translateY(0px)' },
        }
      }
    },
  },
  plugins: [],
}
