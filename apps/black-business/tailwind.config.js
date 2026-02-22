/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#23292F",
        secondary: "#384552",
        accent: "#4f46e5",
        xrpl: "#00AAE4",
        vault: "#059669",
        lending: "#7c3aed",
        loyalty: "#d97706",
        community: "#dc2626",
      },
    },
  },
  plugins: [],
};
