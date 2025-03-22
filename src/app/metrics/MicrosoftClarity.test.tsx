import { render } from '@testing-library/react';
import MicrosoftClarity from './MicrosoftClarity';

// Mock de next/script para evitar carregamento real do script durante os testes
jest.mock('next/script', () => {
  return function Script(props: any) {
    // Armazenar o dangerouslySetInnerHTML como atributo data para poder testar
    const dataHtml = props.dangerouslySetInnerHTML?.__html;
    return <script data-testid="clarity-script" data-html={dataHtml} {...props} />;
  };
});

describe('MicrosoftClarity Component', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    // Limpar os mocks do console
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    // Backup do NODE_ENV original
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restaurar o ambiente original
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('não renderiza nada em ambiente de desenvolvimento', () => {
    // Simular ambiente de desenvolvimento
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development' });
    
    const { container } = render(<MicrosoftClarity />);
    expect(container.firstChild).toBeNull();
  });

  it('não renderiza nada se o ID do Clarity não estiver definido', () => {
    // Simular ambiente de produção sem ID do Clarity
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production' });
    process.env.NEXT_PUBLIC_MICROSOFT_CLARITY = '';
    
    const { container } = render(<MicrosoftClarity />);
    expect(container.firstChild).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(
      'Microsoft Clarity ID não configurado. Adicione NEXT_PUBLIC_MICROSOFT_CLARITY ao seu .env.local'
    );
  });

  it('renderiza o script do Clarity em ambiente de produção com ID configurado', () => {
    // Simular ambiente de produção com ID do Clarity
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production' });
    process.env.NEXT_PUBLIC_MICROSOFT_CLARITY = 'test-clarity-id';
    
    const { getByTestId } = render(<MicrosoftClarity />);
    const scriptElement = getByTestId('clarity-script');
    
    expect(scriptElement).toBeInTheDocument();
    expect(scriptElement.getAttribute('id')).toBe('microsoft-clarity-init');
    expect(scriptElement.getAttribute('strategy')).toBe('afterInteractive');
    
    // Verifica se o HTML contém o ID do Clarity
    const htmlContent = scriptElement.getAttribute('data-html');
    expect(htmlContent).toContain('test-clarity-id');
  });
}); 