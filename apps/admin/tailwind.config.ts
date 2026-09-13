import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#12211f",
          900: "#18302d",
          700: "#365650",
          500: "#64807b",
        },
        brand: {
          50: "#effcf8",
          100: "#d7f7ec",
          200: "#b2ecd9",
          300: "#7edcc0",
          400: "#48c5a2",
          500: "#25a887",
          600: "#17876d",
          700: "#176c59",
          800: "#175648",
          900: "#15473d",
        },
      },
      boxShadow: {
        panel: "0 1px 2px rgba(18,33,31,.04), 0 12px 32px rgba(18,33,31,.06)",
      },
    },
  },
  plugins: [],
} satisfies Config;
