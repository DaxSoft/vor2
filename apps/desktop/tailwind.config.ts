import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        app: {
          bg: "#05070d",
          panel: "rgba(12, 17, 27, 0.72)",
          panelStrong: "rgba(15, 21, 34, 0.9)",
          border: "rgba(255, 255, 255, 0.105)",
          text: "#f5f8ff",
          muted: "#aebbd1",
          soft: "#8090aa",
        },
        accent: {
          DEFAULT: "#2488ff",
          strong: "#0f7bff",
          soft: "rgba(36, 136, 255)",
        },
      },
      borderRadius: {
        app: "18px",
        panel: "14px",
      },
      boxShadow: {
        glass:
          "0 24px 80px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
        blue: "0 0 0 1px rgba(36, 136, 255, 0.48), 0 0 24px rgba(36, 136, 255, 0.18)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "Segoe UI Variable",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
