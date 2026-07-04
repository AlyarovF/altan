import type { ThemeConfig } from 'antd';

/**
 * AntD v5 theme — ported from apps/web/lib/theme.ts so the admin shares one
 * design language with the public site. Industrial commodity-trading look:
 * graphite ink, brass/amber accent, tight radii, dense controls. The admin runs
 * slightly denser (smaller controlHeight/fontSize) since it is internal tooling.
 */
export const antdTheme: ThemeConfig = {
  token: {
    // Primary drives solid buttons with white text. #C8881C on white was 3.0:1
    // (fails AA); #9A6A00 (amber-deep) lifts white text to ~4.73:1. The brighter
    // #C8881C remains as an on-dark fill (menu-selected uses dark text on it).
    colorPrimary: '#9A6A00',
    colorInfo: '#9A6A00',
    colorSuccess: '#2E7D5B',
    colorError: '#E8543F',
    colorWarning: '#C8881C',
    colorTextBase: '#0E1116',
    colorBgBase: '#FFFFFF',
    // Secondary text (subtitles, timestamps, metadata). AntD's default is ink@45%
    // (~3.0:1 on white — fails WCAG AA). steel-500 (#5E6876 ≈ 5.9:1) passes AA.
    colorTextSecondary: '#5E6876',
    colorLink: '#9A6A00',
    colorLinkHover: '#C8881C',
    borderRadius: 6,
    borderRadiusLG: 8,
    fontFamily: '"Montserrat", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    fontSize: 14,
    controlHeight: 36,
    wireframe: false,
  },
  components: {
    Button: { fontWeight: 600, primaryShadow: 'none', defaultBorderColor: '#D9DDE3' },
    Modal: { borderRadiusLG: 10 },
    Input: { colorBorder: '#D9DDE3' },
    Select: { colorBorder: '#D9DDE3' },
    Tag: { borderRadiusSM: 4 },
    Card: { borderRadiusLG: 10 },
    Table: { headerBg: '#F6F7F9', headerColor: '#3A424E', cellPaddingBlock: 10 },
    Layout: { siderBg: '#161A1F', headerBg: '#FFFFFF', headerHeight: 56 },
    Menu: {
      darkItemBg: '#161A1F',
      darkSubMenuItemBg: '#0E1116',
      darkItemSelectedBg: '#C8881C',
      darkItemSelectedColor: '#0E1116',
    },
  },
};
