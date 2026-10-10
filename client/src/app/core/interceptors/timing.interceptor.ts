import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';
import { RequestLogService } from '../services/request-log.service';

export const timingInterceptor: HttpInterceptorFn = (req, next) => {
  const requestLogService = inject(RequestLogService);

  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const startTime = performance.now();

  requestLogService.startRequest(requestId, req.method, req.urlWithParams);

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          const durationMs = Math.round(performance.now() - startTime);
          requestLogService.completeRequest(requestId, event.status, durationMs);
        }
      },
      error: (error) => {
        const durationMs = Math.round(performance.now() - startTime);
        const errorMsg = error?.error?.message || error?.message || 'Network error';
        requestLogService.failRequest(requestId, error.status || 0, durationMs, errorMsg);
      },
    })
  );
};
