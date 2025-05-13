# Documentação Técnica - Brasil Rental Karts

## 1. Visão Geral do Sistema

O Brasil Rental Karts é uma plataforma web desenvolvida para gerenciamento completo de ligas de kart rental, oferecendo funcionalidades para criação e administração de ligas, campeonatos, categorias, pilotos e resultados de corridas. A aplicação utiliza uma arquitetura moderna baseada em Next.js com Supabase como backend.

### 1.1 Objetivos do Sistema

- Fornecer uma plataforma completa para gestão de ligas de kart rental
- Permitir o cadastro e gerenciamento de pilotos, ligas, campeonatos e corridas
- Oferecer visualização de classificações e estatísticas
- Implementar um sistema de autenticação seguro
- Disponibilizar uma interface responsiva e intuitiva

### 1.2 Público-Alvo

- Organizadores de ligas de kart rental
- Pilotos participantes
- Espectadores e entusiastas

## 2. Arquitetura do Sistema

### 2.1 Visão Geral da Arquitetura

O Brasil Rental Karts utiliza uma arquitetura cliente-servidor moderna, com separação clara entre frontend e backend:

- **Frontend**: Aplicação Next.js (React) com App Router
- **Backend**: Supabase (PostgreSQL + APIs RESTful)
- **Autenticação**: Supabase Auth
- **Armazenamento**: Supabase Storage

### 2.2 Diagrama de Arquitetura

```
+----------------------------------+
|           Cliente                |
|  +----------------------------+  |
|  |        Next.js App         |  |
|  |  +----------------------+  |  |
|  |  |  Componentes React   |  |  |
|  |  +----------------------+  |  |
|  |  |    App Router        |  |  |
|  |  +----------------------+  |  |
|  +----------------------------+  |
+----------------------------------+
              |
              | HTTPS
              |
+----------------------------------+
|           Supabase               |
|  +----------------------------+  |
|  |      Autenticação         |  |  
|  +----------------------------+  |
|  |      PostgreSQL           |  |  
|  +----------------------------+  |
|  |      Storage              |  |  
|  +----------------------------+  |
|  |      Row Level Security   |  |  
|  +----------------------------+  |
+----------------------------------+
```

## 3. Stack Tecnológico

### 3.1 Frontend

- **Framework**: Next.js 15 com React 19
- **Estilização**: TailwindCSS 4
- **Componentes UI**: Baseados na biblioteca shadcn/ui
- **Ícones**: Lucide React
- **Formulários**: React Hook Form com validação Zod
- **Gerenciamento de Estado**: React Hooks
- **Fontes**: Geist Sans e Geist Mono

### 3.2 Backend

- **Plataforma**: Supabase
- **Banco de Dados**: PostgreSQL
- **Autenticação**: Supabase Auth
- **Armazenamento**: Supabase Storage
- **Segurança**: Row Level Security (RLS)

### 3.3 DevOps

- **Hospedagem**: Vercel (inferido)
- **Análise**: Vercel Analytics
- **Controle de Versão**: Git

## 4. Estrutura do Projeto

```
brasil-rental-karts/
├── public/           # Arquivos estáticos (imagens, favicon, etc.)
├── src/              # Código fonte da aplicação
│   ├── app/          # Páginas da aplicação (Next.js App Router)
│   │   ├── api/      # Rotas de API
│   │   ├── auth/     # Páginas de autenticação
│   │   ├── league/   # Páginas de liga específica
│   │   ├── leagues/  # Páginas de listagem de ligas
│   │   ├── login/    # Página de login
│   │   ├── pilot/    # Páginas de piloto
│   │   └── page.tsx  # Página inicial
│   ├── components/   # Componentes reutilizáveis
│   │   ├── layout/   # Componentes de layout (navbar, footer, etc.)
│   │   └── ui/       # Componentes de UI (botões, cards, etc.)
│   ├── email-templates/ # Templates de email
│   └── lib/          # Utilitários e funções auxiliares
│       ├── logger/   # Sistema de logging
│       └── utils.ts  # Funções utilitárias
└── supabase/         # Configurações do Supabase
    └── migrations/   # Migrações do banco de dados
```

## 5. Modelo de Dados

### 5.1 Entidades Principais

#### Pilot Profiles
- Armazena informações dos pilotos
- Campos: id, name, email, phone, bio, avatar_url, created_at, updated_at

#### Leagues
- Representa as ligas de kart
- Campos: id, name, description, owner_id, logo_url, created_at, updated_at

#### Championships
- Campeonatos dentro de uma liga
- Relacionamento: Pertence a uma Liga

#### Categories
- Categorias dentro de um campeonato
- Relacionamento: Pertence a um Campeonato

#### Races
- Corridas/etapas de um campeonato
- Campos incluem double_points para etapas com pontuação em dobro

#### Race Results
- Resultados de cada piloto em uma corrida

#### Scoring Systems
- Sistemas de pontuação para campeonatos

### 5.2 Relacionamentos

- Uma Liga possui vários Campeonatos
- Um Campeonato possui várias Categorias
- Um Campeonato possui várias Corridas
- Uma Categoria possui vários Pilotos
- Uma Corrida possui vários Resultados
- Um Piloto possui vários Resultados

## 6. Sistema de Autenticação

### 6.1 Fluxo de Autenticação

O sistema utiliza o Supabase Auth para gerenciamento de autenticação:

1. Usuário acessa a página de login
2. Insere credenciais (email/senha) ou utiliza login social
3. Supabase Auth valida as credenciais
4. Token JWT é gerado e armazenado
5. Usuário é redirecionado para a área logada

### 6.2 Gerenciamento de Sessão

- Sessões são gerenciadas pelo Supabase Auth
- O componente Header verifica o estado de autenticação
- Rotas protegidas verificam a existência de sessão válida

### 6.3 Segurança

- Row Level Security (RLS) no banco de dados
- Políticas de acesso definidas por tabela
- Autenticação baseada em JWT
- Triggers para criação automática de perfil após cadastro

## 7. Componentes Principais

### 7.1 Componentes de Layout

- **Header**: Barra de navegação principal com menu de usuário
- **ConditionalFooter**: Rodapé condicional da aplicação

### 7.2 Componentes de Funcionalidade

- **CreateLeagueModal**: Modal para criação de novas ligas
- **LeagueStandings**: Exibição de classificação de pilotos em uma liga
- **UnifiedCalendar**: Calendário unificado de corridas
- **AddPilotToCategoryModal**: Adição de pilotos a categorias
- **CreateChampionshipModal**: Criação de campeonatos
- **EditRaceResultModal**: Edição de resultados de corridas

## 8. Fluxos de Dados Principais

### 8.1 Criação de Liga

1. Usuário acessa o modal de criação de liga
2. Preenche informações (nome, descrição, logo)
3. Frontend envia dados para o Supabase
4. Supabase armazena os dados e aplica políticas RLS
5. Liga é criada e usuário é redirecionado

### 8.2 Visualização de Classificação

1. Componente LeagueStandings é carregado
2. Solicita dados de campeonatos, categorias e resultados ao Supabase
3. Processa os dados para calcular pontuações e posições
4. Renderiza a classificação por categoria

### 8.3 Registro de Resultado

1. Usuário acessa o modal de adição/edição de resultado
2. Preenche posição, tempo, voltas, etc.
3. Frontend envia dados para o Supabase
4. Supabase armazena os resultados
5. Classificação é atualizada automaticamente

## 9. Armazenamento

### 9.1 Buckets de Armazenamento

- **pilot-avatars**: Armazena avatares de pilotos
  - Limite: 5MB por arquivo
  - Tipos permitidos: JPEG, PNG, GIF
  - Acesso: Público

- **league-logos**: Armazena logos das ligas
  - Limite: 5MB por arquivo
  - Tipos permitidos: JPEG, PNG, GIF
  - Acesso: Público

## 10. Considerações de Segurança

### 10.1 Row Level Security

O sistema implementa políticas RLS para garantir que usuários só possam acessar e modificar dados conforme suas permissões:

- Qualquer pessoa pode visualizar perfis de pilotos
- Apenas o próprio piloto pode atualizar seu perfil
- Qualquer pessoa pode visualizar ligas
- Apenas usuários autenticados podem criar ligas
- Apenas proprietários podem atualizar ou excluir suas ligas

### 10.2 Validação de Dados

- Validação no frontend usando Zod
- Validação no backend através de constraints do PostgreSQL

## 11. Considerações de Performance

### 11.1 Otimizações de Frontend

- Uso do App Router do Next.js para otimização de rotas
- Componentes React otimizados
- Carregamento sob demanda de dados

### 11.2 Otimizações de Backend

- Índices no banco de dados para consultas frequentes
- Políticas RLS otimizadas
- Armazenamento em cache quando apropriado

## 12. Extensibilidade

### 12.1 Adição de Novas Funcionalidades

O sistema foi projetado para ser facilmente extensível:

- Componentes modulares e reutilizáveis
- Estrutura de dados flexível
- Separação clara entre frontend e backend

### 12.2 Migrações de Banco de Dados

O sistema utiliza migrações SQL para evolução do esquema:

- Migrações iniciais para criação do esquema
- Migrações incrementais para adição de funcionalidades (ex: double_points para corridas)

## 13. API Endpoints

### 13.1 Endpoints Principais

#### Ligas
```
GET    /api/leagues           # Lista todas as ligas
POST   /api/leagues           # Cria uma nova liga
GET    /api/leagues/:id       # Obtém detalhes de uma liga
PUT    /api/leagues/:id       # Atualiza uma liga
DELETE /api/leagues/:id       # Remove uma liga
```

#### Campeonatos
```
GET    /api/championships           # Lista campeonatos
POST   /api/championships           # Cria novo campeonato
GET    /api/championships/:id       # Obtém detalhes
PUT    /api/championships/:id       # Atualiza campeonato
DELETE /api/championships/:id       # Remove campeonato
```

#### Pilotos
```
GET    /api/pilots           # Lista pilotos
POST   /api/pilots           # Cadastra piloto
GET    /api/pilots/:id       # Obtém perfil
PUT    /api/pilots/:id       # Atualiza perfil
```

### 13.2 Respostas da API

- Sucesso: Status 2XX com dados JSON
- Erro Cliente: Status 4XX com mensagem de erro
- Erro Servidor: Status 5XX com identificador de erro

## 14. Tratamento de Erros

### 14.1 Frontend

- Feedback visual imediato para usuários
- Mensagens de erro amigáveis
- Retry automático para falhas de rede
- Validação de formulários em tempo real

### 14.2 Backend

- Logging estruturado de erros
- Monitoramento de exceções
- Respostas de erro padronizadas
- Rollback automático em transações falhas

## 15. Configuração de Ambiente

### 15.1 Variáveis de Ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# App
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_APP_ENV=

# Analytics
NEXT_PUBLIC_ANALYTICS_ID=
```

### 15.2 Deployment

1. **Desenvolvimento Local**
```bash
npm install
npm run dev
```

2. **Produção (Vercel)**
- Conectar repositório ao Vercel
- Configurar variáveis de ambiente
- Deploy automático a cada push

## 16. Conclusão

O Brasil Rental Karts é uma aplicação web moderna e bem estruturada para gerenciamento de ligas de kart rental. Utiliza tecnologias atuais como Next.js, React, TailwindCSS e Supabase para oferecer uma experiência completa tanto para organizadores quanto para pilotos.

A arquitetura do sistema permite escalabilidade e extensibilidade, enquanto as políticas de segurança garantem a proteção dos dados. O modelo de dados abrangente suporta todas as entidades necessárias para o gerenciamento completo de ligas, campeonatos, categorias, pilotos e resultados.

Esta documentação técnica serve como referência para desenvolvedores que trabalham no projeto, facilitando a compreensão da arquitetura, estrutura e fluxos de dados do sistema.