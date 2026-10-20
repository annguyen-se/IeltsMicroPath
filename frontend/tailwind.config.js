/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'monospace'],
        serif: ['Newsreader', 'Georgia', 'serif'],
      },
      colors: {
        paper: {
          DEFAULT: '#fcfbf9',
          50: '#fdfcfb',
          100: '#fbfaf8',
          200: '#f5f3ef',
          300: '#ece8e1',
        },
        ink: {
          DEFAULT: '#292524',
          muted: '#57534e',
          faint: '#78716c',
        },
        accent: {
          DEFAULT: '#c2410c',
          hover: '#9a3412',
          soft: '#ffedd5',
        },
        moss: {
          DEFAULT: '#15803d',
          soft: '#dcfce7',
        },
        brick: {
          DEFAULT: '#b91c1c',
          soft: '#fee2e2',
        },
        cobalt: {
          DEFAULT: '#1d4ed8',
          soft: '#dbeafe',
        }
      }
    },
  },
  plugins: [],
}
