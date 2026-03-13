import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        claim: {
          bg: '#000000',
          'bg-1': '#08080C',
          'bg-2': '#0F0F15',
          'bg-3': '#16161F',
          'bg-4': '#1E1E2A',
          card: '#08080C',
          border: 'rgba(255, 255, 255, 0.06)',
          'border-md': 'rgba(255, 255, 255, 0.1)',
          'border-strong': 'rgba(255, 255, 255, 0.16)',
          text: '#A0A0B0',
          'text-dim': '#686878',
          'text-muted': '#404050',
          'text-secondary': '#E0E0E8',
          purple: '#9945FF',
          'purple-bright': '#B06FFF',
          'purple-deep': '#7B2FCC',
          green: '#14F195',
          'green-dim': '#0FBF75',
          success: '#34D399',
          warning: '#FBBF24',
          error: '#F87171',
          info: '#60A5FA',
        },
      },
      fontFamily: {
        display: ['var(--font-sora)', 'Sora', 'sans-serif'],
        sans: ['var(--font-inter)', 'Inter', '-apple-system', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        none: '0',
      },
      boxShadow: {
        'claim': '0 0 20px rgba(153, 69, 255, 0.15)',
        'claim-md': '0 0 40px rgba(153, 69, 255, 0.2)',
        'claim-lg': '0 0 60px rgba(153, 69, 255, 0.25)',
        'claim-green': '0 0 20px rgba(20, 241, 149, 0.15)',
      },
    },
  },
  plugins: [],
}
export default config
