/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        accent: 'var(--accent)',
        'accent-light': 'var(--accent-light)',
        'accent-dark': 'var(--accent-dark)',
        'gray-800': 'var(--gray-800)',
        'gray-700': 'var(--gray-700)',
        'gray-600': 'var(--gray-600)',
        'card-bg': 'var(--card-bg)',
        'border-color': 'var(--border-color)',
      },
      fontFamily: {
        sans: [
          'var(--font-geist-sans)',
          'system-ui',
          'sans-serif'
        ],
        mono: [
          'var(--font-geist-mono)',
          'monospace'
        ]
      },
      animation: {
        glow: 'glow 2s ease-in-out infinite alternate'
      },
      keyframes: {
        glow: {
          '0%': {
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)'
          },
          '100%': {
            boxShadow: '0 0 30px rgba(139, 92, 246, 0.8)'
          }
        }
      }
    }
  },
  plugins: [],
}