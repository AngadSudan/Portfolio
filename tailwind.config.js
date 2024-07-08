/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html'],
  theme: {
    extend: {
      keyframes: {
        gradientFill: {
          '0%': { backgroundPosition: '0% 50%',
              
           },
          '100%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        gradientFill: 'gradientFill 5s linear infinite',
      },
    },
  },
  plugins: [],
}