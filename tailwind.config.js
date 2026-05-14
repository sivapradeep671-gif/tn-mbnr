/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        // Customer Theme — Aspirational, Modern
        customer: {
          primary: '#6366f1',      // Indigo-500
          'primary-light': '#818cf8',
          'primary-dark': '#4f46e5',
          accent: '#06b6d4',       // Cyan-500
          'accent-light': '#22d3ee',
          surface: '#0f172a',      // Slate-900
          'surface-alt': '#1e293b',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
        },
        // Government Theme — Authoritative, Professional
        gov: {
          primary: '#1e3a5f',      // Navy
          'primary-light': '#2563eb',
          'primary-dark': '#0f2341',
          accent: '#eab308',       // TN Gold
          'accent-light': '#fbbf24',
          surface: '#020617',      // Slate-950
          'surface-alt': '#0f172a',
          success: '#22c55e',
          warning: '#f97316',
          danger: '#dc2626',
          info: '#3b82f6',
        },
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'shine': 'shine 1.5s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'scan-pulse': 'scan-pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fade-in 0.4s ease-out',
        'progress-bar': 'progress-bar 2s ease-in-out infinite',
      },
      boxShadow: {
        'neon-yellow': '0 0 10px rgba(234, 179, 8, 0.3), 0 0 20px rgba(234, 179, 8, 0.1)',
        'neon-blue': '0 0 15px rgba(59, 130, 246, 0.3), 0 0 30px rgba(59, 130, 246, 0.1)',
        'neon-indigo': '0 0 15px rgba(99, 102, 241, 0.3), 0 0 30px rgba(99, 102, 241, 0.1)',
        'neon-cyan': '0 0 15px rgba(6, 182, 212, 0.3), 0 0 30px rgba(6, 182, 212, 0.1)',
        'inner-glow': 'inset 0 0 12px rgba(255, 255, 255, 0.05)',
        'gov-card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
      },
      letterSpacing: {
        'tightest': '-.075em',
        'technical': '0.15em',
        'mega': '0.25em',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shine: {
          '100%': { left: '125%' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)' },
        },
        'scan-pulse': {
          '0%': { transform: 'scale(0.95)', opacity: '0.7', boxShadow: '0 0 0 0 rgba(99, 102, 241, 0.4)' },
          '70%': { transform: 'scale(1)', opacity: '1', boxShadow: '0 0 0 15px rgba(99, 102, 241, 0)' },
          '100%': { transform: 'scale(0.95)', opacity: '0.7', boxShadow: '0 0 0 0 rgba(99, 102, 241, 0)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'progress-bar': {
          '0%': { transform: 'translateX(-100%)' },
          '50%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
}
