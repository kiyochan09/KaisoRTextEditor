/**
 * Application Error & System Activity Logger
 * Records runtime errors, paste events, DOCX imports, and database operations.
 */

export type LogLevel = 'error' | 'warn' | 'info' | 'success';
export type LogCategory = 'clipboard' | 'docx-import' | 'database' | 'editor' | 'system';

export interface ErrorLogEntry {
  id: string;
  timestamp: string; // ISO or formatted string
  timeString: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: string;
  stack?: string;
}

type LogListener = (logs: ErrorLogEntry[]) => void;

const STORAGE_KEY = 'rightnote_app_error_logs_v1';
const MAX_LOGS = 200;

class ErrorLogManager {
  private logs: ErrorLogEntry[] = [];
  private listeners: Set<LogListener> = new Set();

  constructor() {
    this.loadLogs();
    this.setupGlobalHandlers();
  }

  private loadLogs() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.logs = JSON.parse(saved);
      }
    } catch {
      this.logs = [];
    }
  }

  private saveLogs() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs.slice(0, MAX_LOGS)));
    } catch {
      // ignore storage quota errors
    }
  }

  private setupGlobalHandlers() {
    if (typeof window === 'undefined') return;

    window.addEventListener('error', (event) => {
      this.addLog({
        level: 'error',
        category: 'system',
        message: event.message || '予期せぬスクリプトエラー',
        details: `${event.filename}:${event.lineno}:${event.colno}`,
        stack: event.error?.stack,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      this.addLog({
        level: 'error',
        category: 'system',
        message: reason?.message || '未処理のPromise例外 (Unhandled Rejection)',
        details: typeof reason === 'object' ? JSON.stringify(reason, null, 2) : String(reason),
        stack: reason?.stack,
      });
    });
  }

  public getLogs(): ErrorLogEntry[] {
    return [...this.logs];
  }

  public getErrorCount(): number {
    return this.logs.filter((l) => l.level === 'error').length;
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    listener(this.getLogs());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const current = this.getLogs();
    this.listeners.forEach((listener) => {
      try {
        listener(current);
      } catch (err) {
        console.error('Error in log listener:', err);
      }
    });
  }

  public addLog(entry: {
    level: LogLevel;
    category: LogCategory;
    message: string;
    details?: string;
    stack?: string;
  }): ErrorLogEntry {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ja-JP', { hour12: false }) + '.' + String(now.getMilliseconds()).padStart(3, '0');
    
    const newEntry: ErrorLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now.toISOString(),
      timeString,
      level: entry.level,
      category: entry.category,
      message: entry.message,
      details: entry.details,
      stack: entry.stack,
    };

    this.logs.unshift(newEntry);
    if (this.logs.length > MAX_LOGS) {
      this.logs = this.logs.slice(0, MAX_LOGS);
    }

    this.saveLogs();
    this.notify();

    // Output to developer console as well
    const prefix = `[${entry.category.toUpperCase()}]`;
    if (entry.level === 'error') {
      console.error(prefix, entry.message, entry.details || '', entry.stack || '');
    } else if (entry.level === 'warn') {
      console.warn(prefix, entry.message, entry.details || '');
    } else {
      console.log(prefix, entry.message, entry.details || '');
    }

    return newEntry;
  }

  public clearLogs() {
    this.logs = [];
    this.saveLogs();
    this.notify();
  }

  public exportLogsAsText(): string {
    return this.logs
      .map((l) => {
        let text = `[${l.timestamp}] [${l.level.toUpperCase()}] [${l.category}] ${l.message}`;
        if (l.details) text += `\n  詳細: ${l.details}`;
        if (l.stack) text += `\n  スタック: ${l.stack}`;
        return text;
      })
      .join('\n----------------------------------------\n');
  }
}

export const logger = new ErrorLogManager();

// Convenience logging functions
export function logError(category: LogCategory, message: string, err?: any) {
  let details = '';
  let stack = '';
  if (err) {
    if (err instanceof Error) {
      details = err.message;
      stack = err.stack || '';
    } else if (typeof err === 'object') {
      try {
        details = JSON.stringify(err, null, 2);
      } catch {
        details = String(err);
      }
    } else {
      details = String(err);
    }
  }
  return logger.addLog({ level: 'error', category, message, details, stack });
}

export function logWarn(category: LogCategory, message: string, details?: any) {
  const detailStr = typeof details === 'object' ? JSON.stringify(details) : details ? String(details) : undefined;
  return logger.addLog({ level: 'warn', category, message, details: detailStr });
}

export function logInfo(category: LogCategory, message: string, details?: any) {
  const detailStr = typeof details === 'object' ? JSON.stringify(details) : details ? String(details) : undefined;
  return logger.addLog({ level: 'info', category, message, details: detailStr });
}

export function logSuccess(category: LogCategory, message: string, details?: any) {
  const detailStr = typeof details === 'object' ? JSON.stringify(details) : details ? String(details) : undefined;
  return logger.addLog({ level: 'success', category, message, details: detailStr });
}
