const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // O diretório onde o app Next.js está localizado
  dir: './',
});

// Configuração personalizada do Jest
const customJestConfig = {
  // Adiciona mais configurações de setup aqui, se necessário
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    // Manipula mapeamentos de módulos para imports usando @ (que apontam para o diretório src/)
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Diretórios onde os testes estão localizados
  testMatch: ['**/__tests__/**/*.test.(js|jsx|ts|tsx)'],
  // Cobertura de código
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/api/**',
    '!src/app/globals.css',
  ],
  transform: {
    // Usa babel-jest com a configuração específica para testes
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.config.test.js' }],
  },
};

// Exporta a configuração do Jest
module.exports = createJestConfig(customJestConfig); 