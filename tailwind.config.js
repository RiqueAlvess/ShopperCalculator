/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        uber: {
          black:   '#000000',
          surface: '#111111',
          card:    '#1a1a1a',
          border:  '#2a2a2a',
          muted:   '#6b6b6b',
          sub:     '#999999',
          green:   '#06C167',
          red:     '#E8413E',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    }
  },
  plugins: []
}
