/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#10B981',
          hover: '#059669',
        },
        bg: {
          base: '#0f172a',
          card: 'rgba(30, 41, 59, 0.7)',
        },
        accent: '#3b82f6',
        danger: '#ef4444',
        success: '#22c55e',
      },
      fontFamily: {
        base: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        'radial-gradient': 'radial-gradient(circle at 15% 50%, rgba(16, 185, 129, 0.05), transparent 25%), radial-gradient(circle at 85% 30%, rgba(59, 130, 246, 0.05), transparent 25%)',
        'title-gradient': 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        'primary': '0 4px 12px 0 rgba(16, 185, 129, 0.3)',
      }
    },
  },
  plugins: [],
}
