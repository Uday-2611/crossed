/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./App.tsx", "./components/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1F6F5C',
          dark: '#195C4D',
        },
        background: '#F6F8F7',
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#E9F0EE',
        },
        text: {
          primary: '#1E2A27',
          secondary: '#5F6F6B',
          muted: '#9AA8A3',
        },
        border: '#DDE5E2',
      },
    },
  },
  plugins: [],
}