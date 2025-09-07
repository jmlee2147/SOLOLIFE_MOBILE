/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  presets: [
    require('nativewind/preset'),
  ],
  theme: {
    extend: {
      colors: {
        yellow50: '#FFFADD',
        yellow500: '#FFE787',
        yellow900: '#EE7A13',

        green50: '#DBDCC1',
        green200: '#B3B56C',
        green500: '#6A8042',
        green900: '#1E3006',

        white: '#FFFFFF',
        gray50: '#F4F4F4',
        gray200: '#D4D4D4',
        gray500: '#AFAFAF',
        gray700: '#6B6B6B',
        black: '#121212'
      },
      
      fontFamily: {
        pretendardExtraBold: ['Pretendard-ExtraBold'],
        pretendardSemiBold: ['Pretendard-SemiBold'],
        pretendardMedium: ['Pretendard-Medium'],
        pretendardRegular: ['Pretendard-Regular'],
        pretendardLight: ['Pretendard-Light'],
      },

      fontSize: {
        'title-1': ['28px', { lineHeight: 1.2 }],
        'title-2': ['24px', { lineHeight: 1.2 }],
        'title-3': ['24px', { lineHeight: 1.2}],

        'heading-1': ['20px', { lineHeight: 1.4 }],
        'heading-2': ['18px', { lineHeight: 1.4 }],
        'heading-3': ['16px', { lineHeight: 1.4 }],

        'body-0': ['18px', { lineHeight: 1.4 }],
        'body-1': ['16px', { lineHeight: 1.4 }],
        'body-2': ['14px', { lineHeight: 1.4 }],
        'body-3': ['12px', { lineHeight: 1.4 }],

        'caption': ['10px', { lineHeight: 1.4, letterSpacing: '0.2px' }],

        'button-1': ['18px', { lineHeight: 1.2 }],
        'button-2': ['16px', { lineHeight: 1.2 }],
    },
  },
  plugins: [],
}}