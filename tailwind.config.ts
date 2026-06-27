import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                dattes: {
                    50: "#FDF6E3",
                    100: "#F5E6C8",
                    200: "#E8C97A",
                    400: "#C17A2B",
                    600: "#8B4A0F",
                    800: "#5C2D00",
                    900: "#3D1C00",
                },
                sand: "#FAF0DC",
                espresso: "#3D1C00",
            },
            borderRadius: {
                lg: "14px",
                md: "9px",
                sm: "7px",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
};

export default config;
