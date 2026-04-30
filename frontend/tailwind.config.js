/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dt-bg-primary': 'var(--bg-primary)',
        'dt-bg-secondary': 'var(--bg-secondary)',
        'dt-bg-card': 'var(--bg-card)',
        'dt-accent-cyan': 'var(--accent-cyan)',
        'dt-accent-green': 'var(--accent-green)',
        'dt-text-primary': 'var(--text-primary)',
        'dt-text-muted': 'var(--text-muted)',
        'dt-border': 'var(--border-subtle)',
        'dt-border-medium': 'var(--border-medium)',
      },
      fontFamily: {
        sora: ['Sora', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
        inter: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out both',
        'pulse-ring': 'pulseRing 1.2s ease-out infinite',
        'skeleton-pulse': 'skeletonPulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(1.8)', opacity: '0' },
        },
        skeletonPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
}
