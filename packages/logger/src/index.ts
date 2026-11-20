export interface LogContext {
  service: string;
  correlationId?: string;
  tenantId?: string;
  opticalCentreId?: string;
  workstationId?: string;
  staffId?: string;
  [key: string]: unknown;
}

const SENSITIVE_KEYS = new Set(['password', 'passwordHash', 'accessToken', 'refreshToken', 'secret']);

export function redactSensitive(input: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (SENSITIVE_KEYS.has(key)) {
      output[key] = '[REDACTED]';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      output[key] = redactSensitive(value as Record<string, unknown>);
    } else {
      output[key] = value;
    }
  }
  return output;
}

export class StructuredLogger {
  constructor(private readonly defaultService: string) {}

  format(level: 'info' | 'warn' | 'error', message: string, context: Partial<LogContext> = {}): string {
    const safeContext = redactSensitive(context as Record<string, unknown>);
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      service: context.service || this.defaultService,
      message,
      ...safeContext,
    });
  }

  info(message: string, context: Partial<LogContext> = {}): void {
    console.log(this.format('info', message, context));
  }

  warn(message: string, context: Partial<LogContext> = {}): void {
    console.warn(this.format('warn', message, context));
  }

  error(message: string, context: Partial<LogContext> = {}): void {
    console.error(this.format('error', message, context));
  }
}
