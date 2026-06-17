/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Statuts de build
        success: '#1a7f37',
        failed: '#cf222e',
        running: '#9a6700',
        aborted: '#6e7781',
        // Palette GitHub Primer
        gh: {
          canvas: '#ffffff',
          subtle: '#f6f8fa',
          inset: '#eaeef2',
          border: '#d0d7de',
          muted: '#d8dee4',
          fg: '#1f2328',
          'fg-muted': '#656d76',
          'fg-subtle': '#6e7781',
          accent: '#0969da',
          'accent-subtle': '#ddf4ff',
          header: '#1f2328',
          'success-fg': '#1a7f37',
          'success-emphasis': '#1f883d',
          'success-subtle': '#dafbe1',
          'danger-fg': '#cf222e',
          'danger-subtle': '#ffebe9',
          'attention-fg': '#9a6700',
          'attention-subtle': '#fff8c5',
          'done-fg': '#8250df',
          'done-subtle': '#fbefff',
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
