import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#12203A",
        canvas: "#F5F7FB",
        brand: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          300: "#A5B4FC",
          500: "#5B5FEF",
          600: "#4B4FD8",
          700: "#3D40B6",
        },
      },
      boxShadow: {
        card: "0 18px 50px -24px rgba(18, 32, 58, 0.22)",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
