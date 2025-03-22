# Brasil Rental Karts

![Logo BRK](public/brk_logo.svg)

Uma plataforma completa para gestão de ligas de kart rental no Brasil. Disponibiliza ferramentas profissionais para organização de campeonatos, gerenciamento de pilotos e acompanhamento de resultados.

## Visão Geral

O Brasil Rental Karts (BRK) é uma solução digital desenvolvida para atender as necessidades específicas do mercado de kart rental no Brasil. A plataforma permite que organizadores de ligas criem e gerenciem competições de forma profissional, enquanto pilotos podem manter seus perfis, acompanhar resultados e conectar-se com a comunidade.

### Principais Funcionalidades

#### Para Organizadores de Ligas
- Criação e gerenciamento de campeonatos
- Gestão de inscrições de pilotos
- Controle de pontuações automáticas
- Registro de resultados de corridas
- Publicação de classificações e estatísticas

#### Para Pilotos
- Criação de perfil personalizado
- Histórico completo de resultados
- Estatísticas de desempenho
- Ranking na comunidade
- Descoberta de novas competições

#### Comunidade Conectada
- Compartilhamento de resultados
- Descoberta de campeonatos
- Integração entre diferentes ligas
- Networking entre pilotos

## Tecnologias Utilizadas

O Brasil Rental Karts foi desenvolvido utilizando tecnologias modernas para garantir performance, escalabilidade e uma excelente experiência do usuário:

- **Frontend**: Next.js 15 com React 19
- **Estilização**: TailwindCSS 4 com sistema de design customizado
- **UI Components**: Baseados na biblioteca shadcn/ui
- **Ícones**: Lucide React
- **Formulários**: React Hook Form com validação Zod
- **Design System**: Sistema proprietário com tema personalizável e modo claro/escuro

## Instalação e Configuração

### Pré-requisitos
- Node.js 18 ou superior
- npm, yarn, pnpm ou bun
- Docker e Docker Compose (opcional, para execução local do SonarQube)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/wernerjr/brasil-rental-karts.git
cd brasil-rental-karts

# Instale as dependências
npm install
# ou
yarn install
# ou
pnpm install
# ou
bun install
```

### Executando em ambiente de desenvolvimento

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
# ou
bun dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador para visualizar a aplicação.

## Qualidade de Código e Testes

O projeto utiliza ferramentas modernas para garantir a qualidade do código e manter os padrões de desenvolvimento:

### Testes

```bash
# Executar todos os testes
npm run test

# Executar testes em modo watch
npm run test:watch

# Executar testes com relatório de cobertura
npm run test:coverage
```

### SonarQube

O projeto está configurado para utilizar o SonarQube para análise de qualidade de código. Para mais informações sobre como configurar e utilizar o SonarQube, consulte o arquivo [SONARQUBE.md](SONARQUBE.md).

```bash
# Iniciar o servidor SonarQube local (requer Docker)
npm run sonar:start

# Executar a análise do SonarQube
npm run sonar

# Desligar o servidor SonarQube local
npm run sonar:stop
```

## Estrutura do Projeto

```
brasil-rental-karts/
├── public/           # Arquivos estáticos (imagens, favicon, etc.)
├── src/              # Código fonte da aplicação
│   ├── app/          # Páginas da aplicação (Next.js App Router)
│   ├── components/   # Componentes reutilizáveis
│   │   ├── layout/   # Componentes de layout (navbar, footer, etc.)
│   │   └── ui/       # Componentes de UI (botões, cards, etc.)
│   └── lib/          # Utilitários e funções auxiliares
└── ...               # Arquivos de configuração
```

## Modelo de Negócio

O Brasil Rental Karts opera com um modelo de negócio baseado em assinaturas, oferecendo diferentes planos para organizadores de ligas e pilotos:

### Planos para Organizadores
- **Gratuito**: Gerenciamento de uma liga, até 20 pilotos
- **Profissional**: Gerenciamento de múltiplas ligas, até 100 pilotos, estatísticas avançadas
- **Enterprise**: Solução personalizada para grandes ligas com necessidades específicas

### Planos para Pilotos
- **Gratuito**: Perfil básico e participação em ligas
- **Premium**: Estatísticas avançadas, histórico completo e recursos exclusivos

## Propriedade Intelectual

Este projeto é privado e proprietário. Todo o código, design e conteúdo estão protegidos por direitos autorais e não podem ser copiados, modificados ou distribuídos sem autorização expressa. O acesso a este repositório é restrito apenas a colaboradores autorizados.