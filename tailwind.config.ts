import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#20313b",
        sky: "#4e92c6",
        leaf: "#4d9b72",
        butter: "#f8c94e",
      },
    },
  },
  plugins: [],
};

export default config;
