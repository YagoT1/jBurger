export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export interface LogEvent { level: LogLevel; message: string; context?: Record<string, unknown>; timestamp: string; }
export interface MetricEvent { name: string; value: number; tags?: Record<string, string>; timestamp: string; }
export interface TraceSpan { traceId: string; spanId: string; name: string; startedAt: string; endedAt?: string; attributes?: Record<string, unknown>; }
export interface TelemetryAuditEvent { action: string; resource: string; actorId?: string; tenantId?: string; metadata?: Record<string, unknown>; }
export interface TelemetryClient { log(event: LogEvent): void; metric(event: MetricEvent): void; trace(span: TraceSpan): void; audit(event: TelemetryAuditEvent): void; }
export const createConsoleTelemetry = (): TelemetryClient => ({ log: (event) => console.log(JSON.stringify(event)), metric: (event) => console.log(JSON.stringify(event)), trace: (span) => console.log(JSON.stringify(span)), audit: (event) => console.log(JSON.stringify({ type: 'audit', ...event })) });
export const frontendTelemetry = createConsoleTelemetry;
export const backendTelemetry = createConsoleTelemetry;
