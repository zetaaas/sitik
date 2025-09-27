import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1f2937',
        accent: '#10b981',
      },
    },
  },
  plugins: [],
} satisfies Config;
