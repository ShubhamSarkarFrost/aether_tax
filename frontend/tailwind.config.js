/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        oktawave: {
          blue: '#2DB5DA',
          gray: '#939598',
          dark: '#303036',
        },
        aether: {
          orange: '#dc6900',
          amber: '#eb8c00',
          red: '#e0301e',
          darkred: '#a32020',
          maroon: '#602320',
        },
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

