/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0A0A0A",
        card: "#111111",
        border: "#1E1E1E",
        primary: "#00FFD1",
        secondary: "#8458FF",
        accent: "#FFDC00",
        muted: "#555555",
        text: "#E8E8E8",
      },
      fontFamily: {
        mono: ["'Space Mono'", "monospace"],
        display: ["'Rajdhani'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #00FFD1, #8458FF)",
        "gradient-card": "linear-gradient(160deg, #111111 0%, #0D0D0D 100%)",
      },
      boxShadow: {
        neon: "0 0 20px rgba(0,255,209,0.15), 0 0 40px rgba(0,255,209,0.05)",
        "neon-sm": "0 0 10px rgba(0,255,209,0.2)",
        purple: "0 0 20px rgba(132,88,255,0.2)",
        card: "0 4px 24px rgba(0,0,0,0.6)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 8s linear infinite",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
};
