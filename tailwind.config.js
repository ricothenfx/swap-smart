/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--bg-rgb) / <alpha-value>)",
        surface: "rgb(var(--surface-rgb) / <alpha-value>)",
        "surface-2": "rgb(var(--surface-2-rgb) / <alpha-value>)",
        ink: "rgb(var(--ink-rgb) / <alpha-value>)",
        muted: "rgb(var(--muted-rgb) / <alpha-value>)",
        line: "rgb(var(--line-rgb) / <alpha-value>)",
        accent: "rgb(var(--accent-rgb) / <alpha-value>)",
        "accent-ink": "rgb(var(--accent-ink-rgb) / <alpha-value>)",
        "accent-soft": "rgb(var(--accent-soft-rgb) / <alpha-value>)",
        good: "rgb(var(--good-rgb) / <alpha-value>)",
        "good-soft": "rgb(var(--good-soft-rgb) / <alpha-value>)",
        warn: "rgb(var(--warn-rgb) / <alpha-value>)",
        "warn-soft": "rgb(var(--warn-soft-rgb) / <alpha-value>)",
        bad: "rgb(var(--bad-rgb) / <alpha-value>)",
        "bad-soft": "rgb(var(--bad-soft-rgb) / <alpha-value>)",
      },
      fontFamily: {
        sans: [
          "Inter Variable",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono Variable",
          "JetBrains Mono",
          "ui-monospace",
          "SF Mono",
          "Menlo",
          "monospace",
        ],
      },
      boxShadow: {
        card: "var(--shadow-card)",
        pop: "var(--shadow-pop)",
      },
    },
  },
  plugins: [],
}
