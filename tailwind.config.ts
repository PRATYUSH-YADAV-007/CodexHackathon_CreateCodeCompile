import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: { colors: { ink: "#1C2434", lilac: "#EEE9FF", peach: "#FFF0E8", mint: "#E6F8ED" }, boxShadow: { soft: "0 16px 45px rgba(41, 48, 69, .10)" } } },
  plugins: []
} satisfies Config;
