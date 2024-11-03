/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        primary: {
          bg: '#1c1917', // stone-950
          fg: '#ffffff', // white
        },
        secondary: {
          bg: '#111827', // gray-900
          fg: '#f3f4f6', // gray-100
        },
        tertiary: {
          bg: '#1f2937', // gray-800
          fg: '#e5e7eb', // gray-200
        },
        accent: {
          DEFAULT: '#3b82f6', // blue-500
          focus: '#6366f1', // indigo-500
        },
      },
    },
    variants: {
      extend: {
        opacity: ['disabled'],
        border: ['disabled'],
      }
    },
  },
  plugins: [],
};
