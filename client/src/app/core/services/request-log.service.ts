import { Injectable, signal, computed } from '@angular/core';
import { RequestLog } from '../models/request-log.model';

@Injectable({
  providedIn: 'root',
})
export class RequestLogService {
  // Signal holding history of requests
  readonly logs = signal<RequestLog[]>([]);

  // Computed average response time for completed requests
  readonly averageDurationMs = computed(() => {
    const completed = this.logs().filter((l) => l.durationMs !== undefined);
    if (completed.length === 0) return 0;
    const sum = completed.reduce((acc, curr) => acc + (curr.durationMs || 0), 0);
    return Math.round(sum / completed.length);
  });

  // Track new request
  startRequest(id: string, method: string, url: string): void {
    const newLog: RequestLog = {
      id,
      method,
      url,
      status: 'pending',
      timestamp: new Date(),
    };
    this.logs.update((items) => [newLog, ...items.slice(0, 49)]); // keep last 50
  }

  // Mark request succeeded
  completeRequest(id: string, statusCode: number, durationMs: number): void {
    this.logs.update((items) =>
      items.map((log) =>
        log.id === id
          ? { ...log, status: 'success', statusCode, durationMs }
          : log
      )
    );
  }

  // Mark request failed
  failRequest(id: string, statusCode: number, durationMs: number, errorMessage?: string): void {
    this.logs.update((items) =>
      items.map((log) =>
        log.id === id
          ? { ...log, status: 'error', statusCode, durationMs, errorMessage }
          : log
      )
    );
  }

  clearLogs(): void {
    this.logs.set([]);
  }
}
