/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#dbe4ff',
          200: '#bac8ff',
          300: '#91a7ff',
          400: '#748ffc',
          500: '#5c7cfa',
          600: '#4c6ef5',
          700: '#4263eb',
          800: '#3b5bdb',
          900: '#364fc7',
        },
        warm: {
          50: '#fff9f5',
          100: '#fff1e6',
          200: '#ffe0cc',
          300: '#ffc9a3',
          400: '#ffb380',
          500: '#ff9c5a',
          600: '#f08c3a',
          700: '#d97722',
          800: '#b8621a',
          900: '#954f15',
        },
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
        },
        surface: {
          0: '#ffffff',
          50: '#f8f9fc',
          100: '#f1f3f8',
          200: '#e4e7ef',
          300: '#d1d5e0',
          700: '#2a2f3e',
          800: '#1e2230',
          850: '#181c28',
          900: '#13161f',
          950: '#0d0f16',
        }
      },
      fontFamily: {
        sans: ['"Inter"', '"Nunito"', 'system-ui', 'sans-serif'],
        display: ['"Nunito"', '"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0,0,0,0.07), 0 10px 20px -2px rgba(0,0,0,0.04)',
        'soft-lg': '0 10px 40px -10px rgba(0,0,0,0.1)',
        'glow-brand': '0 0 20px rgba(76, 110, 245, 0.15)',
        'glow-success': '0 0 20px rgba(16, 185, 129, 0.15)',
        'inner-soft': 'inset 0 2px 4px rgba(0,0,0,0.04)',
      }
    },
  },
  plugins: [],
}
