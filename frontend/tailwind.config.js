/** @type {import('tailwindcss').Config} */
// Design tokens live here as the single source of truth so every node, field,
// and chrome element inherits the same palette/spacing/radius/shadow.
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Tokens resolve to CSS variables (see index.css) using the
        // `rgb(var(--x) / <alpha-value>)` form so theme flips AND `/opacity`
        // modifiers (text-ink-faint/50, border-hairline/60, accent/30) work.
        accent: {
          DEFAULT: 'rgb(var(--flow-accent) / <alpha-value>)',
          hover: 'rgb(var(--flow-accent-hover) / <alpha-value>)',
          pressed: 'rgb(var(--flow-accent-pressed) / <alpha-value>)',
          tint: 'rgb(var(--flow-accent-tint) / <alpha-value>)',
          ring: 'rgb(var(--flow-accent-ring) / <alpha-value>)',
        },
        canvas: 'rgb(var(--flow-canvas) / <alpha-value>)',
        card: 'rgb(var(--flow-card) / <alpha-value>)',
        field: 'rgb(var(--flow-field) / <alpha-value>)',
        hairline: 'rgb(var(--flow-hairline) / <alpha-value>)',
        ink: {
          DEFAULT: 'rgb(var(--flow-ink) / <alpha-value>)',
          muted: 'rgb(var(--flow-ink-muted) / <alpha-value>)',
          faint: 'rgb(var(--flow-ink-faint) / <alpha-value>)',
        },
        port: 'rgb(var(--flow-port) / <alpha-value>)',
        // Per-category accents: used for the node icon + 3px left bar only.
        cat: {
          io: '#0ea5e9',
          llm: '#8b5cf6',
          logic: '#f59e0b',
          data: '#10b981',
          net: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      borderRadius: {
        node: '12px',
        field: '8px',
      },
      boxShadow: {
        node: '0 1px 2px rgba(16,24,40,0.06), 0 4px 12px rgba(16,24,40,0.08)',
        'node-hover': '0 2px 4px rgba(16,24,40,0.08), 0 8px 24px rgba(16,24,40,0.12)',
        'node-selected': '0 0 0 2px #513dd9, 0 8px 24px rgba(81,61,217,0.18)',
        pop: '0 8px 30px rgba(16,24,40,0.16)',
      },
      transitionDuration: {
        140: '140ms',
      },
    },
  },
  plugins: [],
};
