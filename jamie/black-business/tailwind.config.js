/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#23292F",
        secondary: "#384552",
        accent: "#4f46e5",
        vault: "#059669",
        lending: "#7c3aed",
        loyalty: "#d97706",
        community: "#dc2626",
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
};
