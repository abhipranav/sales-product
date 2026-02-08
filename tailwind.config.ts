import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        cloud: "#F6F4EF",
        ember: "#A4431B",
        leaf: "#0F766E",
        cobalt: "#1E3A8A"
      },
      boxShadow: {
        pane: "0 12px 30px -18px rgba(17, 24, 39, 0.45)"
      }
    }
  },
  plugins: []
};

export default config;
