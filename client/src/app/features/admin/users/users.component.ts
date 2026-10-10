import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { User, Role, AccessLevel } from '../../../core/models/user.model';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    BadgeComponent,
    SkeletonComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsersComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly Role = Role;
  readonly AccessLevel = AccessLevel;
  readonly roleOptions = Object.values(Role);
  readonly accessLevelOptions = Object.values(AccessLevel);

  // Users State
  readonly users = signal<User[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly searchTerm = signal<string>('');

  // Modals state
  readonly isCreateModalOpen = signal<boolean>(false);
  readonly isEditModalOpen = signal<boolean>(false);
  readonly isResetPasswordModalOpen = signal<boolean>(false);
  readonly isDeleteDialogOpen = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);

  // Target user for Edit / Reset Password / Delete
  readonly selectedUser = signal<User | null>(null);

  // Forms
  readonly createForm = this.fb.group({
    userId: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.pattern(/^[a-zA-Z0-9_-]+$/),
      ],
    ],
    name: ['', [Validators.required, Validators.minLength(2)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: [Role.GeneralUser, [Validators.required]],
    accessLevel: [AccessLevel.Internal, [Validators.required]],
    isActive: [true],
  });

  readonly editForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    role: [Role.GeneralUser, [Validators.required]],
    accessLevel: [AccessLevel.Internal, [Validators.required]],
    isActive: [true],
  });

  readonly resetPasswordForm = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  // Filtered users computed signal
  readonly filteredUsers = computed(() => {
    const q = this.searchTerm().toLowerCase().trim();
    if (!q) return this.users();
    return this.users().filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.userId.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        u.accessLevel.toLowerCase().includes(q)
    );
  });

  // Helper checking if a given user is the currently logged in admin
  isSelf(user: User): boolean {
    return user.userId === this.authService.currentUser()?.userId;
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.userService
      .getAllUsers()
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          this.users.set(res.users);
        },
        error: (err) => {
          this.errorMessage.set(
            err?.error?.message || 'Failed to load users list from server'
          );
        },
      });
  }

  private showSuccess(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => {
      this.successMessage.set(null);
    }, 4000);
  }

  // --- CREATE USER ---
  openCreateModal(): void {
    this.createForm.reset({
      userId: '',
      name: '',
      password: '',
      role: Role.GeneralUser,
      accessLevel: AccessLevel.Internal,
      isActive: true,
    });
    this.errorMessage.set(null);
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  submitCreate(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const val = this.createForm.getRawValue();

    this.userService
      .createUser({
        userId: val.userId!,
        name: val.name!,
        password: val.password!,
        role: val.role!,
        accessLevel: val.accessLevel!,
        isActive: val.isActive ?? true,
      })
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          this.closeCreateModal();
          this.showSuccess(`User '${res.user.userId}' created successfully!`);
          this.loadUsers();
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.message || 'Failed to create user');
        },
      });
  }

  // --- EDIT USER ---
  openEditModal(user: User): void {
    this.selectedUser.set(user);
    this.editForm.reset({
      name: user.name,
      role: user.role,
      accessLevel: user.accessLevel,
      isActive: user.isActive,
    });

    // Guard: disable role and active status fields if editing own account
    if (this.isSelf(user)) {
      this.editForm.get('role')?.disable();
      this.editForm.get('isActive')?.disable();
    } else {
      this.editForm.get('role')?.enable();
      this.editForm.get('isActive')?.enable();
    }

    this.errorMessage.set(null);
    this.isEditModalOpen.set(true);
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.selectedUser.set(null);
  }

  submitEdit(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const user = this.selectedUser();
    if (!user) return;

    this.isSubmitting.set(true);
    const formVal = this.editForm.getRawValue();

    this.userService
      .updateUser(user.userId, {
        name: formVal.name!,
        role: formVal.role!,
        accessLevel: formVal.accessLevel!,
        isActive: formVal.isActive ?? true,
      })
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          this.closeEditModal();
          this.showSuccess(`User '${res.user.userId}' updated successfully!`);
          // If admin updated their own name, refresh session profile
          if (this.isSelf(user)) {
            this.authService.getProfile().subscribe();
          }
          this.loadUsers();
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.message || 'Failed to update user');
        },
      });
  }

  // --- RESET PASSWORD ---
  openResetPasswordModal(user: User): void {
    this.selectedUser.set(user);
    this.resetPasswordForm.reset({ newPassword: '' });
    this.errorMessage.set(null);
    this.isResetPasswordModalOpen.set(true);
  }

  closeResetPasswordModal(): void {
    this.isResetPasswordModalOpen.set(false);
    this.selectedUser.set(null);
  }

  submitResetPassword(): void {
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    const user = this.selectedUser();
    if (!user) return;

    this.isSubmitting.set(true);
    const { newPassword } = this.resetPasswordForm.getRawValue();

    this.userService
      .resetPassword(user.userId, newPassword!)
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          this.closeResetPasswordModal();
          this.showSuccess(res.message);
        },
        error: (err) => {
          this.errorMessage.set(
            err?.error?.message || 'Failed to reset password'
          );
        },
      });
  }

  // --- DELETE USER ---
  openDeleteDialog(user: User): void {
    if (this.isSelf(user)) {
      this.errorMessage.set('You cannot delete your own administrator account');
      return;
    }
    this.selectedUser.set(user);
    this.isDeleteDialogOpen.set(true);
  }

  closeDeleteDialog(): void {
    this.isDeleteDialogOpen.set(false);
    this.selectedUser.set(null);
  }

  confirmDelete(): void {
    const user = this.selectedUser();
    if (!user) return;

    this.isSubmitting.set(true);
    this.userService
      .deleteUser(user.userId)
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          this.closeDeleteDialog();
          this.showSuccess(res.message);
          this.loadUsers();
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.message || 'Failed to delete user');
        },
      });
  }
}
