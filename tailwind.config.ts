import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      screens: {
      'sm': '640px',
      'md': '1080px', // Ubah default md jadi 1080px
      'lg': '1280px',
      'xl': '1536px',
    },
    },
  },
  plugins: [],
};

export default config;
