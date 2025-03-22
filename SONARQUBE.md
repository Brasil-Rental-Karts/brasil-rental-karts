# Configuração do SonarQube para Brasil Rental Karts

Este documento descreve como configurar e usar o SonarQube para análise de qualidade de código no projeto Brasil Rental Karts.

## Requisitos

- Node.js (versão 16+)
- Docker e Docker Compose (para execução local do SonarQube)
- Acesso a um servidor SonarQube (ou usar a configuração local)

## Configuração das Variáveis de Ambiente

O projeto utiliza variáveis de ambiente para configurar o acesso ao SonarQube. Você precisa criar um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
SONAR_TOKEN=seu_token_aqui
SONAR_HOST_URL=http://localhost:9000
```

Um arquivo de exemplo `.env.example` é fornecido como referência.

## Configuração Local do SonarQube

### 1. Iniciar o servidor SonarQube local

```bash
npm run sonar:start
```

Isso iniciará o SonarQube em http://localhost:9000. O login padrão é:
- Username: admin
- Password: admin

Na primeira vez que acessar, você será solicitado a alterar a senha.

### 2. Criar um novo projeto no SonarQube

1. Faça login no SonarQube
2. Clique em "Create a new project"
3. Defina a chave do projeto como "brasil-rental-karts"
4. Defina o nome do projeto como "Brasil Rental Karts"
5. Gere um token para o projeto (Clique em seu perfil > My Account > Security > Generate Token)
6. Copie o token gerado

### 3. Configurar o token no projeto

Copie o token gerado e adicione-o ao arquivo `.env`:

```
SONAR_TOKEN=seu_token_aqui
SONAR_HOST_URL=http://localhost:9000
```

## Executando a Análise

### 1. Gerar relatórios de cobertura de testes

```bash
npm run test:coverage
```

### 2. Executar a análise do SonarQube

```bash
npm run sonar
```

### 3. Visualizar os resultados

Acesse http://localhost:9000/dashboard?id=brasil-rental-karts para ver os resultados da análise.

## Integração Contínua

Para integrar o SonarQube com CI/CD, adicione a análise como uma etapa em seus pipelines:

### GitHub Actions

```yaml
name: SonarQube Analysis

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  sonarqube:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests with coverage
        run: npm run test:coverage
      - name: SonarQube Scan
        uses: SonarSource/sonarqube-scan-action@master
        env:
          SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

## Desligando o SonarQube Local

Para desligar o servidor SonarQube local:

```bash
npm run sonar:stop
```

## Métricas Analisadas

O SonarQube analisa várias métricas, incluindo:

- Bugs e vulnerabilidades
- Code smells (problemas de manutenção)
- Duplicação de código
- Complexidade ciclomática
- Cobertura de testes
- Documentação
- Padrões de codificação 