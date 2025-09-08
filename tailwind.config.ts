import type { Config } from "tailwindcss"

const config: Config = {
    content: [
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/styles/**/*.{css,scss}", // para tus estilos globales
    ],
    theme: {
        extend: {},
    },
    plugins: [],
}

export default config
