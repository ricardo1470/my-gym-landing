import type { Config } from "tailwindcss"
import animate from "tailwindcss-animate"

const config: Config = {
    content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/styles/**/*.{css,scss}", // para tus estilos globales
  ],
  theme: {
    extend: {},
  },
  plugins: [
    animate,
  ],
}

export default config
