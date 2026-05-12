import type { Config } from "tailwindcss";

const preset: Partial<Config> = {
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
          soft: "#8090aa"
        },
        accent: {
          DEFAULT: "#2488ff",
          strong: "#0f7bff",
          soft: "rgba(36, 136, 255, 0.14)"
        }
      }
    }
  }
};

export default preset;
