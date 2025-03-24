// Adiciona compatibilidade com bibliotecas que usam matchMedia
if (typeof window !== 'undefined') {
  window.matchMedia = window.matchMedia || function() {
    return {
      matches: false,
      addListener: function() {},
      removeListener: function() {}
    };
  };
}

// Configuração do Testing Library
import '@testing-library/jest-dom';

// Mock global para o Next.js Image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock para fetch
global.fetch = jest.fn();

// Limpa mocks após cada teste
afterEach(() => {
  jest.clearAllMocks();
}); 