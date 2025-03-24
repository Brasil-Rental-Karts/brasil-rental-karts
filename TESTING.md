# Estrutura de Testes do Brasil Rental Karts

Este projeto utiliza Jest e React Testing Library para testes automatizados.

## Estrutura de Pastas

Os testes estão organizados da seguinte forma:

- `__tests__/` - Pasta raiz para todos os testes
  - `components/` - Testes para componentes React
  - `pages/` - Testes para páginas da aplicação
  - `lib/` - Testes para funções utilitárias e bibliotecas
  - `utils/` - Testes para funções auxiliares

## Executando os Testes

Para executar os testes, utilize os seguintes comandos:

```bash
# Executar todos os testes
npm test

# Executar testes em modo de observação (watch mode)
npm run test:watch

# Gerar relatório de cobertura
npm run test:coverage
```

## Convenções

1. **Nomenclatura de Arquivos**:
   - Testes para componentes: `ComponentName.test.tsx`
   - Testes para páginas: `[page-name].test.tsx`
   - Testes para utilitários: `util-name.test.ts`

2. **Mocks**:
   - Arquivos de mock estão em `__mocks__/`
   - Componentes externos são mockados em `jest.setup.js`

## Configuração

A configuração do Jest está dividida em dois arquivos principais:

- `jest.config.js` - Configuração principal do Jest
- `jest.setup.js` - Configuração de setup para testes (mocks globais, etc.)

### Mock para Arquivos Estáticos

O Jest está configurado para lidar com importações de arquivos estáticos:

- CSS, SCSS, SASS: mockados com `identity-obj-proxy`
- Imagens e outros arquivos: mockados como string 'test-file-stub'

### Mocks de Next.js

Este projeto configura mocks automáticos para:

- `next/router` - Mockado com funções que simulam navegação
- `next/navigation` - Mockado com funções que simulam navegação e manipulação de URL

## Exemplos

### Teste de Componente

```typescript
import { render, screen } from '@testing-library/react';
import { ComponentName } from '@/components/component-name';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Teste de Função Utilitária

```typescript
import { utilFunction } from '@/lib/utils';

describe('utilFunction', () => {
  it('returns expected result', () => {
    expect(utilFunction('input')).toBe('expected output');
  });
}); 