// Carrega as variáveis de ambiente do arquivo .env
require('dotenv').config();

const scanner = require('sonarqube-scanner').default;

scanner(
  {
    serverUrl: process.env.SONAR_HOST_URL,
    token: process.env.SONAR_TOKEN,
    options: {
      'sonar.projectKey': 'brasil-rental-karts',
      'sonar.projectName': 'Brasil Rental Karts',
      'sonar.projectVersion': '0.1.0',
      'sonar.projectDescription': 'Plataforma para ligas de kart rental',
      'sonar.sources': 'src',
      'sonar.tests': 'src',
      'sonar.test.inclusions': '**/*.test.tsx,**/*.test.ts',
      'sonar.typescript.lcov.reportPaths': 'coverage/lcov.info',
      'sonar.javascript.lcov.reportPaths': 'coverage/lcov.info',
      'sonar.sourceEncoding': 'UTF-8',
      'sonar.exclusions': 'node_modules/**,**/*.test.tsx,**/*.test.ts,**/*.spec.tsx,**/*.spec.ts,coverage/**,.next/**'
    }
  },
  () => process.exit()
); 