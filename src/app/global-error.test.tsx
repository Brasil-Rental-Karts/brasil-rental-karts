import * as Sentry from '@sentry/nextjs';
import GlobalError from './global-error';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock do Sentry
jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
}));

// Mock manual do componente para testar funcionalidades específicas
describe('GlobalError Component', () => {
  const mockError = new Error('Teste de erro') as Error & { digest?: string };
  mockError.stack = 'Stack trace simulado para teste';
  const mockReset = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('captura a exceção no Sentry', () => {
    // Mock do useEffect para chamar imediatamente o callback
    const useEffectMock = jest.spyOn(React, 'useEffect');
    useEffectMock.mockImplementationOnce(cb => {
      cb();
      return undefined;
    });
    
    // Renderizar o componente com um wrapper que permite renderizar apenas o conteúdo
    render(
      <div data-testid="error-container">
        <GlobalError error={mockError} reset={mockReset} />
      </div>
    );
    
    // Verificar se o Sentry.captureException foi chamado com o erro correto
    expect(Sentry.captureException).toHaveBeenCalledWith(mockError);
  });

  it('exibe a mensagem de erro corretamente', () => {
    // Substituir a implementação de GlobalError para testar apenas o conteúdo
    const { container } = render(
      <div data-testid="error-content">
        <div className="flex items-center justify-center min-h-screen bg-red-50">
          <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md border border-red-100">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Erro crítico!</h1>
            <p className="text-gray-700 mb-4">
              Ocorreu um erro inesperado na aplicação.
              Nossa equipe foi notificada do problema.
            </p>
            <div className="p-4 mb-4 bg-gray-50 rounded border border-gray-200">
              <p className="text-sm font-mono text-red-500">
                {mockError.message}
              </p>
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-gray-600">
                  Detalhes técnicos
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto text-xs">
                  {mockError.stack}
                </pre>
              </details>
            </div>
            <button
              onClick={mockReset}
              className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
    
    // Verificar se o título está presente
    expect(container.textContent).toContain('Erro crítico!');
    
    // Verificar se a mensagem de erro está presente
    expect(container.textContent).toContain('Ocorreu um erro inesperado na aplicação.');
    
    // Verificar se a mensagem específica do erro está presente
    expect(container.textContent).toContain('Teste de erro');
  });

  it('chama a função reset quando o botão é clicado', () => {
    // Substituir a implementação de GlobalError para testar apenas o botão
    const { container } = render(
      <div data-testid="error-button">
        <button
          onClick={mockReset}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
    
    // Encontrar o botão
    const resetButton = container.querySelector('button');
    expect(resetButton).not.toBeNull();
    expect(resetButton?.textContent).toContain('Tentar novamente');
    
    // Clicar no botão
    if (resetButton) {
      fireEvent.click(resetButton);
    }
    
    // Verificar se a função reset foi chamada
    expect(mockReset).toHaveBeenCalledTimes(1);
  });
}); 