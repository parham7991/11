const { heroui } = require('@heroui/react');

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        main: '#386bf9',
        'gray-100': '#e4e7e9',
        'gray-400': '#7d8793',
        'gray-500': '#616a76',
      },
      fontFamily: {
        black: 'black',
        bold: 'bold',
        extrabold: 'extrabold',
        semibold: 'semibold',
        reqular: 'reqular',
        light: 'light',
        medium: 'medium',
      },
    },
  },
  darkMode: 'class',
  plugins: [heroui()],
};
