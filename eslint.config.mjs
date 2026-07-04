// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/build/**',
      '**/out/**',
      '**/coverage/**',
      '**/.turbo/**',
      '**/*.config.*',
      '**/next-env.d.ts',
      // The Next.js public site is linted by its own `next lint` (eslint-config-next),
      // which carries the React / react-hooks / @next plugins this root flat config lacks.
      'apps/web/**',
      // Generated OpenAPI client — do not lint hand-style rules over codegen output.
      'packages/shared/src/api-types.ts',
      // Standalone Node ops script (uses Node globals, not part of the app source).
      'apps/admin/serve-admin.mjs',
      // Vendored skills / plugins (e.g. impeccable) — not project source.
      '.claude/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  prettier,
);
