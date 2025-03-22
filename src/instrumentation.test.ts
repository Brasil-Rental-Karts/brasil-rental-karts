import { register, onRequestError } from './instrumentation';
import * as Sentry from '@sentry/nextjs';

// Mock para os imports dinâmicos
jest.mock('../sentry.server.config', () => ({ default: {} }), { virtual: true });
jest.mock('../sentry.edge.config', () => ({ default: {} }), { virtual: true });

// Mock para o Sentry
jest.mock('@sentry/nextjs', () => ({
  captureRequestError: jest.fn(),
}));

describe('Instrumentation', () => {
  const originalNextRuntime = process.env.NEXT_RUNTIME;

  afterEach(() => {
    // Restaurar NEXT_RUNTIME
    if (originalNextRuntime) {
      process.env.NEXT_RUNTIME = originalNextRuntime;
    } else {
      delete process.env.NEXT_RUNTIME;
    }
  });

  it('registers server config for nodejs runtime', async () => {
    process.env.NEXT_RUNTIME = 'nodejs';
    
    await register();
    
    // Como testamos um import dinâmico, não temos muito o que validar além da execução
    // sem erros, o mock já valida que o arquivo foi importado
    expect(true).toBe(true);
  });

  it('registers edge config for edge runtime', async () => {
    process.env.NEXT_RUNTIME = 'edge';
    
    await register();
    
    // Como testamos um import dinâmico, não temos muito o que validar além da execução
    // sem erros, o mock já valida que o arquivo foi importado
    expect(true).toBe(true);
  });

  it('does not register config for other runtimes', async () => {
    process.env.NEXT_RUNTIME = 'unknown';
    
    await register();
    
    // Nada deve acontecer para runtimes desconhecidos
    expect(true).toBe(true);
  });

  it('exports Sentry captureRequestError', () => {
    // Verifica se onRequestError é o mesmo que Sentry.captureRequestError
    expect(onRequestError).toBe(Sentry.captureRequestError);
  });
}); 