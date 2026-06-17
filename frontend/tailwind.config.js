/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Statuts de build (thème sombre)
        success: '#3fb950',
        failed: '#f85149',
        running: '#d29922',
        aborted: '#8b949e',
        // Couleurs de marque Deploy Board
        brand: '#3b82f6',
        'brand-cyan': '#22d3ee',
        // Palette GitHub Primer — thème SOMBRE (façon Changelog)
        gh: {
          canvas: '#0d1117',        // fond principal
          subtle: '#161b22',        // surfaces élevées
          inset: '#010409',         // zones encastrées (logs)
          elevated: '#21262d',      // hover / pills
          border: '#30363d',
          muted: '#21262d',
          fg: '#e6edf3',            // texte principal
          'fg-muted': '#8b949e',    // texte secondaire
          'fg-subtle': '#6e7681',
          accent: '#2f81f7',
          'accent-subtle': 'rgba(56,139,253,0.15)',
          header: '#010409',
          'success-fg': '#3fb950',
          'success-emphasis': '#238636',
          'success-subtle': 'rgba(63,185,80,0.15)',
          'danger-fg': '#f85149',
          'danger-subtle': 'rgba(248,81,73,0.15)',
          'attention-fg': '#d29922',
          'attention-subtle': 'rgba(210,153,34,0.15)',
          'done-fg': '#a371f7',
          'done-subtle': 'rgba(163,113,247,0.15)',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Noto Sans', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      maxWidth: {
        changelog: '1280px',
      },
    },
  },
  plugins: [],
}
