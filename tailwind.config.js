/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        graphite: {
          900: '#0f1117',
          800: '#161b22',
          700: '#1c2230',
          600: '#222d3d',
          500: '#2d3748',
        },
        neon: {
          green: '#39ff14',
          dim: '#22c55e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    }
  },
  plugins: []
}
