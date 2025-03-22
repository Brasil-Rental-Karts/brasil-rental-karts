module.exports = {
  extends: ['next/core-web-vitals'],
  overrides: [
    {
      // Desabilitar regras específicas para arquivos de teste
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      rules: {
        'react/display-name': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
      },
    },
  ],
}; 