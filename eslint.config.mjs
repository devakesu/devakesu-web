import nextConfig from 'eslint-config-next/core-web-vitals';
import tseslint from 'typescript-eslint';

const eslintConfig = [
  ...nextConfig,
  ...tseslint.configs.recommended,
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      'public/js/**',
      'scripts/**',
    ],
  },
];

export default eslintConfig;
