import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { Role } from '../../../core/models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly themeService = inject(ThemeService);

  readonly Role = Role;
  readonly roles = [Role.GeneralUser, Role.Admin];

  // State signals
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal<boolean>(false);

  // Reactive form
  readonly loginForm = this.fb.group({
    userId: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(4)]],
    role: [Role.GeneralUser, [Validators.required]],
  });

  constructor() {
    // Check if user is already authenticated
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }

    // Check if redirected due to expired session
    const reason = this.route.snapshot.queryParamMap.get('reason');
    if (reason === 'session_expired') {
      this.errorMessage.set('Your session has expired. Please log in again.');
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((val) => !val);
  }

  fillDemo(type: 'admin' | 'user'): void {
    if (type === 'admin') {
      this.loginForm.patchValue({
        userId: 'admin1',
        password: 'password123',
        role: Role.Admin,
      });
    } else {
      this.loginForm.patchValue({
        userId: 'user1',
        password: 'password123',
        role: Role.GeneralUser,
      });
    }
    this.errorMessage.set(null);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { userId, password, role } = this.loginForm.getRawValue();

    this.authService
      .login({
        userId: userId!,
        password: password!,
        role: role!,
      })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';
          this.router.navigateByUrl(returnUrl);
        },
        error: (err) => {
          this.isLoading.set(false);
          const message =
            err?.error?.message ||
            (err.status === 401
              ? 'Invalid User ID or Password'
              : err.status === 403
              ? err.error?.message || 'Access Forbidden: Role mismatch'
              : err.status === 429
              ? 'Rate limit exceeded: Please wait before trying again'
              : 'Failed to connect to authentication server');
          this.errorMessage.set(message);
        },
      });
  }
}
