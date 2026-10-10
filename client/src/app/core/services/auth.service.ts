import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, Role, AuthResponse, LoginCredentials } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly TOKEN_KEY = 'accessdesk_token';
  private readonly USER_KEY = 'accessdesk_user';

  // Signals
  readonly token = signal<string | null>(this.getStoredToken());
  readonly currentUser = signal<User | null>(this.getStoredUser());

  // Computed states
  readonly isAuthenticated = computed(() => !!this.token() && !!this.currentUser());
  readonly isAdmin = computed(() => this.currentUser()?.role === Role.Admin);
  readonly userRole = computed(() => this.currentUser()?.role ?? null);
  readonly userAccessLevel = computed(() => this.currentUser()?.accessLevel ?? null);

  private getStoredToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private getStoredUser(): User | null {
    try {
      const data = localStorage.getItem(this.USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap((response) => {
          this.setSession(response.token, response.user);
        }),
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }

  getProfile(): Observable<{ success: boolean; user: User }> {
    return this.http
      .get<{ success: boolean; user: User }>(`${environment.apiUrl}/me`)
      .pipe(
        tap((res) => {
          if (res?.user) {
            this.currentUser.set(res.user);
            localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
          }
        })
      );
  }

  private setSession(token: string, user: User): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.token.set(token);
    this.currentUser.set(user);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
