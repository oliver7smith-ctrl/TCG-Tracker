import type { Config } from "tailwindcss"
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["var(--font-inter)", "system-ui", "sans-serif"] },
      colors: {
        brand: {
          50:"#f5f3ff", 100:"#ede9fe", 200:"#ddd6fe", 300:"#c4b5fd",
          400:"#a78bfa", 500:"#7c3aed", 600:"#6d28d9", 700:"#5b21b6",
          800:"#4c1d95", 900:"#2e1065",
        },
      },
    },
  },
  plugins: [],
}
export default config
