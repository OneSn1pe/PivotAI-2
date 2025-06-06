/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,ts,jsx,tsx,mdx}",
      "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
      "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
      "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    safelist: [
      // Only preserve classes that are generated dynamically or from props
      // Category-specific colors that might be generated dynamically
      'bg-blue-500',
      'bg-violet-500', 
      'bg-red-500',
      'bg-emerald-500',
      'bg-indigo-500',
      'bg-orange-500',
      'text-blue-500',
      'text-violet-500',
      'text-red-500', 
      'text-emerald-500',
      'text-indigo-500',
      'text-orange-500',
      // Dynamic grid columns for responsive layouts
      {
        pattern: /^(grid-cols|col-span)-([1-9]|1[0-2])$/,
        variants: ['sm', 'md', 'lg', 'xl']
      },
      // Dynamic spacing that might be calculated
      {
        pattern: /^(m|p)(t|r|b|l|x|y)?-\d+$/,
        variants: ['sm', 'md', 'lg', 'xl']
      }
    ],
    theme: {
      extend: {
        fontFamily: {
          'inter': ['Inter', 'sans-serif'],
          'source': ['"Source Sans Pro"', 'sans-serif']
        },
        animation: {
          'fade-in': 'fadeIn 0.5s ease-out',
          'slide-in': 'slideIn 0.3s ease-out',
          'progress': 'progress 1s ease-out',
          'pulse-subtle': 'pulse-subtle 3s ease-in-out infinite alternate'
        },
        keyframes: {
          fadeIn: {
            '0%': { opacity: 0 },
            '100%': { opacity: 1 }
          },
          slideIn: {
            '0%': { transform: 'translateY(10px)', opacity: 0 },
            '100%': { transform: 'translateY(0)', opacity: 1 }
          },
          progress: {
            '0%': { width: '0%' },
            '100%': { width: '100%' }
          },
          'pulse-subtle': {
            '0%, 100%': { 
              opacity: 1,
              boxShadow: '0 0 8px 1px rgba(15, 118, 110, 0.2)'
            },
            '50%': { 
              opacity: 0.9,
              boxShadow: '0 0 12px 3px rgba(15, 118, 110, 0.3)'
            }
          }
        },
        backdropBlur: {
          'xs': '2px',
        },
        boxShadow: {
          'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
          'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
          'button': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          'button-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        },
        colors: {
          // Professional theme colors
          primary: {
            50: '#f0fdfa',
            100: '#ccfbf1', 
            200: '#99f6e4',
            300: '#5eead4',
            400: '#2dd4bf',
            500: '#14b8a6', // Primary teal
            600: '#0d9488',
            700: '#0f766e',
            800: '#115e59',
            900: '#134e4a',
            950: '#042f2e',
          },
          secondary: {
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b', // Secondary amber
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f',
            950: '#451a03',
          }
        }
      },
    },
    plugins: [],
  };