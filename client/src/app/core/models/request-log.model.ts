export interface RequestLog {
  id: string;
  method: string;
  url: string;
  status: 'pending' | 'success' | 'error';
  durationMs?: number;
  statusCode?: number;
  timestamp: Date;
  errorMessage?: string;
}
