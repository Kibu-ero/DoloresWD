module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0F3FA',
          100: '#D5DEEF',
          200: '#B1C9EF',
          300: '#8AAEE0',
          400: '#638ECB',
          500: '#628ECB',
          600: '#5A80BA',
          700: '#395886',
          800: '#2F486E',
          900: '#243956',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
