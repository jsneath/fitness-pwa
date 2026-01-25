/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Dark mode color palette
        dark: {
          bg: '#0f0f14',
          surface: '#1a1a24',
          'surface-elevated': '#242432',
          border: '#2d2d3d',
          'border-subtle': '#3d3d4d',
        },
        // Accent colors for both modes
        accent: {
          success: '#10b981',
          'success-dark': '#059669',
          danger: '#ef4444',
          'danger-dark': '#dc2626',
        }
      },
    },
  },
  plugins: [],
}
