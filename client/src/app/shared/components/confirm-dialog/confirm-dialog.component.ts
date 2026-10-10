import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="isOpen()"
      class="dialog-overlay"
      (click)="onBackdropClick($event)"
      role="dialog"
      aria-modal="true"
      [attr.aria-label]="title()"
    >
      <div class="dialog-card glass-panel" (click)="$event.stopPropagation()">
        <div class="dialog-header">
          <div class="dialog-icon" [ngClass]="'icon-' + variant()">
            <span *ngIf="variant() === 'danger'">⚠️</span>
            <span *ngIf="variant() === 'primary'">ℹ️</span>
          </div>
          <div class="dialog-title-wrap">
            <h3>{{ title() }}</h3>
            <p>{{ message() }}</p>
          </div>
        </div>

        <div class="dialog-actions">
          <button
            type="button"
            class="btn btn-secondary"
            [disabled]="isLoading()"
            (click)="cancelled.emit()"
          >
            {{ cancelText() }}
          </button>
          <button
            type="button"
            class="btn"
            [ngClass]="variant() === 'danger' ? 'btn-danger' : 'btn-primary'"
            [disabled]="isLoading()"
            (click)="confirmed.emit()"
          >
            <span *ngIf="isLoading()" class="spinner"></span>
            <span>{{ confirmText() }}</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 16px;
      animation: fadeIn 0.15s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .dialog-card {
      width: 100%;
      max-width: 460px;
      padding: 24px 28px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes popIn {
      from {
        transform: scale(0.95) translateY(10px);
        opacity: 0;
      }
      to {
        transform: scale(1) translateY(0);
        opacity: 1;
      }
    }

    .dialog-header {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .dialog-icon {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
      flex-shrink: 0;

      &.icon-danger {
        background: rgba(239, 68, 68, 0.15);
        border: 1px solid rgba(239, 68, 68, 0.3);
      }

      &.icon-primary {
        background: rgba(99, 102, 241, 0.15);
        border: 1px solid rgba(99, 102, 241, 0.3);
      }
    }

    .dialog-title-wrap {
      h3 {
        font-size: 1.15rem;
        margin-bottom: 6px;
      }

      p {
        font-size: 0.875rem;
        color: var(--text-muted);
        line-height: 1.5;
      }
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 8px;
    }

    .spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  readonly isOpen = input<boolean>(false);
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmText = input<string>('Confirm');
  readonly cancelText = input<string>('Cancel');
  readonly variant = input<'danger' | 'primary'>('danger');
  readonly isLoading = input<boolean>(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen() && !this.isLoading()) {
      this.cancelled.emit();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget && !this.isLoading()) {
      this.cancelled.emit();
    }
  }
}
