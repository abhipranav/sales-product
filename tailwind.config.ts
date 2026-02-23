import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111111",
        canvas: "#E3DFD8",
        caution: "#FFFF00",
        industrial: "#1A1A1A",
        cloud: "#F6F4EF",
        ember: "#A4431B",
        leaf: "#0F766E",
        cobalt: "#1E3A8A"
      },
      fontFamily: {
        sans: ["Inter", "IBM Plex Sans", "Segoe UI", "sans-serif"],
        mono: ["Space Mono", "IBM Plex Mono", "Courier New", "monospace"],
        serif: ["Georgia", "Times New Roman", "Noto Serif", "serif"]
      },
      borderWidth: {
        ind: "2px"
      },
      boxShadow: {
        pane: "0 12px 30px -18px rgba(17, 24, 39, 0.45)"
      }
    }
  },
  plugins: []
};

export default config;
