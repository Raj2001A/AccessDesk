import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Don't auto-redirect on failed login attempts so the user can see the error message
      const isLoginRequest = req.url.includes('/api/auth/login');

      if (error.status === 401 && !isLoginRequest) {
        // Expired token or unauthorized
        authService.logout();
        router.navigate(['/login'], {
          queryParams: { returnUrl: router.url, reason: 'session_expired' },
        });
      }

      return throwError(() => error);
    })
  );
};
