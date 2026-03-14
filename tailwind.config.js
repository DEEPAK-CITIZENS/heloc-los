/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        citizens: {
          green:        '#00965E',
          'green-dark': '#007A3D',
          'green-mid':  '#00B56E',
          'green-light':'#E6F4EF',
          'green-pale': '#F0FAF5',
          navy:         '#003087',
          'navy-dark':  '#002060',
          'navy-light': '#E6ECF5',
          gray:         '#4A4F55',
          'gray-light': '#F5F7FA',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 4px 0 rgba(0,0,0,0.08)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.12)',
      }
    }
  },
  plugins: []
}
