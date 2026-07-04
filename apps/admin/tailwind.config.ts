import type { Config } from 'tailwindcss';

/**
 * ALTAN admin — Tailwind config. Mirrors apps/web brand tokens so the admin
 * shares one design language. `preflight` is DISABLED so Tailwind's reset does
 * not fight Ant Design's own reset (antd owns components, Tailwind owns layout).
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#0E1116', soft: '#1A1F27', muted: '#3A424E' },
        steel: {
          50: '#F6F7F9',
          100: '#ECEEF1',
          200: '#D9DDE3',
          300: '#BCC3CD',
          400: '#8C96A4',
          500: '#5E6876',
          600: '#454E5A',
          700: '#333A44',
          800: '#23282F',
          900: '#161A1F',
        },
        amber: { DEFAULT: '#C8881C', bright: '#E9A227', deep: '#9A6A00' },
        signal: { up: '#2E7D5B', down: '#E8543F', flat: '#8C96A4' },
      },
    },
  },
  plugins: [],
};

export default config;
