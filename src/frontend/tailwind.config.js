/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class', // Changed to 'class' for manual dark mode toggle
  theme: {
    extend: {
      colors: {
        // New modern color palette
        primary: {
          50: '#EDF7FF',
          100: '#DBEEFF',
          200: '#B7DDFF',
          300: '#8AC9FF',
          400: '#57ADFF',
          500: '#0086FF', // Main primary color
          600: '#0065DB',
          700: '#004DB7',
          800: '#003A93',
          900: '#002970',
        },
        secondary: {
          50: '#FFF9EF',
          100: '#FEF3DE',
          200: '#FEE7BD',
          300: '#FDDB9C',
          400: '#FBCC7A',
          500: '#FABD59', // Main secondary color
          600: '#F5A419',
          700: '#D68400',
          800: '#A36400',
          900: '#714600',
        },
        accent: {
          50: '#F5EBFF',
          100: '#E9D7FF',
          200: '#D4AFFF',
          300: '#BE86FF',
          400: '#A85EFF',
          500: '#9236FF', // Main accent color
          600: '#7207FF',
          700: '#5A00DB',
          800: '#4300A3',
          900: '#2C006B',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
        light: '#F9FAFB',
        dark: '#111827',
        'gray-50': '#F9FAFB',
        'gray-100': '#F3F4F6',
        'gray-200': '#E5E7EB',
        'gray-300': '#D1D5DB',
        'gray-400': '#9CA3AF',
        'gray-500': '#6B7280',
        'gray-600': '#4B5563',
        'gray-700': '#374151',
        'gray-800': '#1F2937',
        'gray-900': '#111827',
      },
      fontFamily: {
        sans: ['IRANSans', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px 0 rgba(0, 0, 0, 0.05)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}; 