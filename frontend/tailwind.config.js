/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      spacing: {
        '4.5': '1.125rem',
      },
      colors: {
        bg: '#faf9f5',
        surface: '#ffffff',
        surface2: '#f1efe7',
        border: '#e4e1d5',
        ink: '#25282f',
        inkSecondary: '#5b5f6b',
        muted: '#96958a',
        accent: '#a4762e',
        accentStrong: '#7d5920',
        accentSoft: '#f0e6cf',
        sage: '#6f7a52',
        navy: '#1f2740',
        income: '#4f7a56',
        incomeSoft: '#e7ede4',
        expense: '#a1543c',
        expenseSoft: '#f1e4dd',
      },
      fontFamily: {
        serif: ['Georgia', '"Iowan Old Style"', '"Palatino Linotype"', 'serif'],
        sans: ['-apple-system', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(20,20,20,.05), 0 4px 14px rgba(20,20,20,.05)',
      },
    },
  },
  plugins: [],
};
