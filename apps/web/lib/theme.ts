import type { ThemeConfig } from 'antd';
import { palette } from './tokens';

/**
 * Ant Design v5 theme — the component-layer twin of `tailwind.config.ts`.
 * Values below (brass primary, cool neutrals, radii, control heights, type)
 * mirror the Tailwind tokens so antd components and Tailwind layout speak one
 * visual language: the "trading desk / assay certificate" system.
 */
export const antdTheme: ThemeConfig = {
  token: {
    // Interactive brass. The bright brand brass (amber.DEFAULT, used for
    // decorative accents) only yields ~3.0:1 with white button text — below WCAG
    // AA. The deeper brand brass (amber.deep) gives white ≈4.73:1, so every
    // primary button (the main place white-on-brass appears) passes AA from this
    // one token. All colours below reference the shared palette in `lib/tokens.ts`.
    colorPrimary: palette.amber.deep,
    colorInfo: palette.amber.DEFAULT,
    colorSuccess: palette.signal.up,
    colorError: palette.signal.down,
    colorWarning: palette.amber.DEFAULT,
    colorTextBase: palette.ink.DEFAULT,
    colorText: palette.ink[700],
    colorTextSecondary: palette.steel[600],
    colorBgBase: '#FFFFFF',
    colorBorder: palette.steel[200],
    colorBorderSecondary: palette.steel[100],
    colorLink: palette.amber.deep,
    colorLinkHover: palette.amber.DEFAULT,
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    fontFamily: 'var(--font-sans), system-ui, sans-serif',
    fontSize: 15,
    controlHeight: 42,
    lineWidth: 1,
    wireframe: false,
  },
  components: {
    Button: {
      fontWeight: 600,
      primaryShadow: 'none',
      defaultShadow: 'none',
      defaultBorderColor: palette.steel[200],
      paddingInlineLG: 24,
      controlHeightLG: 48,
    },
    Modal: {
      borderRadiusLG: 14,
    },
    Input: {
      colorBorder: palette.steel[200],
      activeShadow: '0 0 0 3px rgba(200,136,28,0.12)',
    },
    Select: {
      colorBorder: palette.steel[200],
    },
    Tag: {
      borderRadiusSM: 4,
      fontSizeSM: 12,
    },
    Card: {
      borderRadiusLG: 14,
    },
    Drawer: {
      colorBgElevated: palette.ink.DEFAULT,
    },
    Dropdown: {
      borderRadiusLG: 10,
    },
  },
};
