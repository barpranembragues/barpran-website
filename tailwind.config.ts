import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Negro y grafitos profundos
        carbon: "#0A0A0B",
        graphite: "#121316",
        steel: "#1C1E22",
        iron: "#2A2C31",
        // Acento BARPRAN
        barpran: {
          DEFAULT: "#E1140F",
          bright: "#FF2018",
          deep: "#8E0B08",
        },
        // Texto
        bone: "#F4F4F2",
        ash: "#8A8D93",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        ultra: "0.42em",
        mega: "0.28em",
      },
      maxWidth: {
        frame: "1680px",
      },
      transitionTimingFunction: {
        race: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
      animation: {
        "spin-slow": "spin-slow 28s linear infinite",
        scan: "scan 6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
