/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        success: '#10b981',
        failed: '#ef4444',
        running: '#f59e0b',
        aborted: '#6b7280',
      }
    },
  },
  plugins: [],
}
