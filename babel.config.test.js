// Configuração Babel apenas para testes
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript',
  ],
  // Ignorar transformações para o next/font
  ignore: [/node_modules\/(?!next\/font)/],
}; 