/* eslint-disable no-console */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success' | 'api';

interface LoggerConfig {
  level: LogLevel;
  timestamp: boolean;
  colors: boolean;
}

class Logger {
  private config: LoggerConfig = {
    level: 'debug',
    timestamp: true,
    colors: true,
  };

  private colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
    bgMagenta: '\x1b[45m',
    bgCyan: '\x1b[46m',
  };

  private levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    success: 1,
    api: 1,
  };

  private getLevelIcon(level: LogLevel): string {
    const icons = {
      debug: '🐛',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      success: '✅',
      api: '🌐',
    };
    return icons[level];
  }

  private getLevelColor(level: LogLevel): string {
    if (!this.config.colors) return '';
    
    const levelColors = {
      debug: this.colors.gray,
      info: this.colors.blue,
      warn: this.colors.yellow,
      error: this.colors.red,
      success: this.colors.green,
      api: this.colors.cyan,
    };
    return levelColors[level];
  }

  private formatTimestamp(): string {
    if (!this.config.timestamp) return '';
    
    const now = new Date();
    const time = now.toLocaleTimeString('fr-FR', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Europe/Paris'
    });
    
    const color = this.config.colors ? this.colors.gray : '';
    const reset = this.config.colors ? this.colors.reset : '';
    
    return `${color}[${time}]${reset} `;
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const timestamp = this.formatTimestamp();
    const icon = this.getLevelIcon(level);
    const color = this.getLevelColor(level);
    const reset = this.config.colors ? this.colors.reset : '';
    const bright = this.config.colors ? this.colors.bright : '';
    
    const levelText = level.toUpperCase().padEnd(7);
    
    return `${timestamp}${icon} ${color}${bright}${levelText}${reset} ${message}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levelPriority[level] >= this.levelPriority[this.config.level];
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message);
    
    switch (level) {
      case 'error':
        console.error(formattedMessage, ...args);
        break;
      case 'warn':
        console.warn(formattedMessage, ...args);
        break;
      default:
        console.log(formattedMessage, ...args);
    }
  }

  // Méthodes publiques
  debug(message: string, ...args: any[]): void {
    this.log('debug', message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log('warn', message, ...args);
  }

  error(message: string, error?: Error | any, ...args: any[]): void {
    if (error instanceof Error) {
      this.log('error', `${message} - ${error.message}`, error.stack, ...args);
    } else if (error) {
      this.log('error', message, error, ...args);
    } else {
      this.log('error', message, ...args);
    }
  }

  success(message: string, ...args: any[]): void {
    this.log('success', message, ...args);
  }

  // Méthodes spécialisées pour les APIs
  api(method: string, url: string, status?: number, data?: any): void {
    const statusColor = this.getStatusColor(status);
    const reset = this.config.colors ? this.colors.reset : '';
    const statusText = status ? `${statusColor}${status}${reset}` : '';
    
    this.log('api', `${method.toUpperCase()} ${url} ${statusText}`);
    
    if (data && status && status >= 200 && status < 300) {
      this.logApiResponse(data);
    }
  }

  private getStatusColor(status?: number): string {
    if (!this.config.colors || !status) return '';
    
    if (status >= 200 && status < 300) return this.colors.green;
    if (status >= 300 && status < 400) return this.colors.yellow;
    if (status >= 400 && status < 500) return this.colors.red;
    if (status >= 500) return this.colors.bgRed;
    
    return '';
  }

  private logApiResponse(data: any): void {
    if (!data) return;
    
    const color = this.config.colors ? this.colors.cyan : '';
    const reset = this.config.colors ? this.colors.reset : '';
    const dim = this.config.colors ? this.colors.dim : '';
    
    console.log(`${color}📦 Response:${reset}`);
    
    // Formatter la réponse de manière lisible
    if (typeof data === 'object') {
      if (data.success !== undefined) {
        console.log(`  ${dim}Success:${reset} ${data.success ? '✅' : '❌'}`);
      }
      
      if (data.data) {
        console.log(`  ${dim}Data:${reset}`);
        this.logObjectSummary(data.data, '    ');
      }
      
      if (data.error) {
        console.log(`  ${dim}Error:${reset} ${this.colors.red}${data.error}${reset}`);
      }
    } else {
      console.log(`  ${dim}${JSON.stringify(data, null, 2)}${reset}`);
    }
  }

  private logObjectSummary(obj: any, indent: string = ''): void {
    if (!obj || typeof obj !== 'object') {
      console.log(`${indent}${obj}`);
      return;
    }

    const color = this.config.colors ? this.colors.dim : '';
    const reset = this.config.colors ? this.colors.reset : '';

    if (Array.isArray(obj)) {
      console.log(`${indent}${color}Array(${obj.length})${reset}`);
      if (obj.length > 0 && obj.length <= 3) {
        obj.forEach((item, index) => {
          console.log(`${indent}  [${index}]:`);
          this.logObjectSummary(item, `${indent}    `);
        });
      } else if (obj.length > 3) {
        console.log(`${indent}  [0]:`);
        this.logObjectSummary(obj[0], `${indent}    `);
        console.log(`${indent}  ... ${obj.length - 1} more items`);
      }
    } else {
      const keys = Object.keys(obj);
      keys.slice(0, 5).forEach(key => {
        const value = obj[key];
        if (typeof value === 'object' && value !== null) {
          console.log(`${indent}${color}${key}:${reset} ${Array.isArray(value) ? `Array(${value.length})` : 'Object'}`);
        } else {
          console.log(`${indent}${color}${key}:${reset} ${value}`);
        }
      });
      
      if (keys.length > 5) {
        console.log(`${indent}${color}... ${keys.length - 5} more properties${reset}`);
      }
    }
  }

  // Méthodes de configuration
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  setTimestamp(enabled: boolean): void {
    this.config.timestamp = enabled;
  }

  setColors(enabled: boolean): void {
    this.config.colors = enabled;
  }

  // Méthodes utilitaires pour les groupes de logs
  group(title: string): void {
    const color = this.config.colors ? this.colors.bright + this.colors.blue : '';
    const reset = this.config.colors ? this.colors.reset : '';
    console.group(`${color}📁 ${title}${reset}`);
  }

  groupEnd(): void {
    console.groupEnd();
  }

  // Méthode pour les séparateurs visuels
  separator(title?: string): void {
    const color = this.config.colors ? this.colors.gray : '';
    const reset = this.config.colors ? this.colors.reset : '';
    const line = '─'.repeat(50);
    
    if (title) {
      console.log(`${color}${line} ${title} ${line}${reset}`);
    } else {
      console.log(`${color}${'─'.repeat(100)}${reset}`);
    }
  }
}

// Instance singleton
export const logger = new Logger();

// Configuration par défaut selon l'environnement
if (process.env.NODE_ENV === 'production') {
  logger.setLevel('info');
} else {
  logger.setLevel('debug');
}

// Export du type pour TypeScript
export type { LogLevel };
