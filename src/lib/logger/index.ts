/**
 * Logger centralizado para aplicação
 * Fornece funções para logs consistentes e formatados
 */

// Cores para terminal ANSI
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Determina se o ambiente é desenvolvimento
const isDev = process.env.NODE_ENV === 'development';

// Tipos de log
type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'debug';

// Interface para dados estruturados nos logs
interface LogData {
  [key: string]: any;
}

/**
 * Formata um objeto para exibição no console
 */
const formatData = (data?: LogData): string => {
  if (!data) return '';
  
  try {
    // Tenta formatar de maneira mais bonita, mas com fallback para JSON.stringify
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
};

/**
 * Obtém a cor ANSI baseada no nível de log
 */
const getColorByLevel = (level: LogLevel): string => {
  switch (level) {
    case 'info': return colors.blue;
    case 'success': return colors.green;
    case 'warning': return colors.yellow;
    case 'error': return colors.red;
    case 'debug': return colors.magenta;
    default: return colors.reset;
  }
};

/**
 * Obtém o emoji baseado no nível de log
 */
const getEmojiByLevel = (level: LogLevel): string => {
  switch (level) {
    case 'info': return 'ℹ️';
    case 'success': return '✅';
    case 'warning': return '⚠️';
    case 'error': return '❌';
    case 'debug': return '🔍';
    default: return '';
  }
};

/**
 * Função principal de log
 */
export const log = (
  level: LogLevel,
  module: string,
  message: string,
  data?: LogData
): void => {
  // Em produção, apenas logs de erro são sempre exibidos
  // Os outros níveis são exibidos apenas em desenvolvimento
  if (!isDev && level !== 'error') return;

  const color = getColorByLevel(level);
  const emoji = getEmojiByLevel(level);
  const timestamp = new Date().toISOString();
  
  const prefix = `${color}${emoji} [${level.toUpperCase()}][${module}]${colors.reset}`;
  
  if (data) {
    console[level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log'](
      `${prefix} ${message} - ${timestamp}`,
      data
    );
  } else {
    console[level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log'](
      `${prefix} ${message} - ${timestamp}`
    );
  }
};

// Funções de conveniência para diferentes níveis de log
export const info = (module: string, message: string, data?: LogData): void => 
  log('info', module, message, data);

export const success = (module: string, message: string, data?: LogData): void => 
  log('success', module, message, data);

export const warning = (module: string, message: string, data?: LogData): void => 
  log('warning', module, message, data);

export const error = (module: string, message: string, data?: LogData): void => 
  log('error', module, message, data);

export const debug = (module: string, message: string, data?: LogData): void => 
  log('debug', module, message, data);

// Exportando objeto logger para uso em importação default
const logger = {
  log,
  info,
  success,
  warning,
  error,
  debug
};

export default logger; 