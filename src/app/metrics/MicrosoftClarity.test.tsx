import { render } from '@testing-library/react';
import MicrosoftClarity from './MicrosoftClarity';
import Clarity from '@microsoft/clarity';

// Mock do Clarity
jest.mock('@microsoft/clarity', () => ({
  init: jest.fn(),
  event: jest.fn(),
  setTag: jest.fn(),
}));

describe('MicrosoftClarity Component', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    // Limpar os mocks do console
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    // Backup do NODE_ENV original
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restaurar o ambiente original
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('não inicializa o Clarity em ambiente de desenvolvimento', () => {
    // Simular ambiente de desenvolvimento
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development' });
    
    render(<MicrosoftClarity />);
    expect(Clarity.init).not.toHaveBeenCalled();
  });

  it('não inicializa o Clarity se o ID não estiver definido', () => {
    // Simular ambiente de produção sem ID do Clarity
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production' });
    process.env.NEXT_PUBLIC_MICROSOFT_CLARITY = '';
    
    render(<MicrosoftClarity />);
    expect(Clarity.init).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(
      'Microsoft Clarity ID não configurado. Adicione NEXT_PUBLIC_MICROSOFT_CLARITY ao seu .env.local'
    );
  });

  it('inicializa o Clarity em ambiente de produção com ID configurado', () => {
    // Simular ambiente de produção com ID do Clarity
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production' });
    process.env.NEXT_PUBLIC_MICROSOFT_CLARITY = 'test-clarity-id';
    
    render(<MicrosoftClarity />);
    
    // Verifica se o Clarity.init foi chamado com o ID correto
    expect(Clarity.init).toHaveBeenCalledWith('test-clarity-id');
    
    // Verifica se o evento de inicialização foi disparado
    expect(Clarity.event).toHaveBeenCalledWith('clarity_initialized');
    
    // Verifica se a tag de versão foi configurada
    expect(Clarity.setTag).toHaveBeenCalledWith('app_version', 'development');
  });
  
  it('trata erros durante a inicialização do Clarity', () => {
    // Simular ambiente de produção com ID do Clarity
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production' });
    process.env.NEXT_PUBLIC_MICROSOFT_CLARITY = 'test-clarity-id';
    
    // Simular um erro durante a inicialização
    const error = new Error('Teste de erro de inicialização');
    (Clarity.init as jest.Mock).mockImplementationOnce(() => {
      throw error;
    });
    
    render(<MicrosoftClarity />);
    
    // Verifica se o erro foi registrado
    expect(console.error).toHaveBeenCalledWith('Erro ao inicializar o Microsoft Clarity:', error);
  });
}); 