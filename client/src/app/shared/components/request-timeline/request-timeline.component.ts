import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RequestLogService } from '../../../core/services/request-log.service';

@Component({
  selector: 'app-request-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="timeline-card glass-panel">
      <div class="timeline-header">
        <div class="title-wrap">
          <div class="pulse-indicator"></div>
          <h4>Request Timeline</h4>
          <span class="avg-tag" title="Average duration of completed requests">
            Avg: {{ requestLogService.averageDurationMs() }}ms
          </span>
        </div>
        <button
          type="button"
          class="clear-btn"
          (click)="requestLogService.clearLogs()"
          title="Clear timeline history"
        >
          Clear
        </button>
      </div>

      <div class="timeline-list" *ngIf="requestLogService.logs().length > 0; else emptyState">
        <div
          *ngFor="let log of requestLogService.logs()"
          class="timeline-item"
          [ngClass]="'status-' + log.status"
        >
          <div class="item-main">
            <span class="method-badge" [ngClass]="'method-' + log.method.toLowerCase()">
              {{ log.method }}
            </span>
            <span class="url-path" [title]="log.url">
              {{ formatUrl(log.url) }}
            </span>
          </div>

          <div class="item-meta">
            <span *ngIf="log.status === 'pending'" class="status-pending">
              <span class="spinner-sm"></span> in-flight
            </span>
            <span *ngIf="log.status === 'success'" class="status-success">
              ✓ {{ log.durationMs }}ms
            </span>
            <span *ngIf="log.status === 'error'" class="status-error" [title]="log.errorMessage || ''">
              ✕ {{ log.statusCode || 'err' }} ({{ log.durationMs }}ms)
            </span>
          </div>
        </div>
      </div>

      <ng-template #emptyState>
        <div class="timeline-empty">
          <span>No requests recorded yet</span>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .timeline-card {
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .timeline-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .title-wrap {
        display: flex;
        align-items: center;
        gap: 10px;

        h4 {
          font-size: 0.95rem;
          margin: 0;
        }
      }
    }

    .pulse-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--success);
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      }
      70% {
        box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
      }
    }

    .avg-tag {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 2px 8px;
      background: rgba(99, 102, 241, 0.15);
      color: var(--primary-400);
      border-radius: var(--radius-full);
      border: 1px solid rgba(99, 102, 241, 0.3);
    }

    .clear-btn {
      background: transparent;
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
      font-size: 0.75rem;
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      transition: var(--transition);

      &:hover {
        background: var(--bg-surface-alt);
        color: var(--text-main);
      }
    }

    .timeline-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 220px;
      overflow-y: auto;
      padding-right: 4px;
    }

    .timeline-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 7px 10px;
      background: var(--bg-surface-alt);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      font-size: 0.82rem;
      transition: var(--transition);

      &.status-pending {
        border-color: rgba(99, 102, 241, 0.4);
      }
      &.status-error {
        border-color: rgba(239, 68, 68, 0.4);
      }
    }

    .item-main {
      display: flex;
      align-items: center;
      gap: 8px;
      overflow: hidden;
    }

    .method-badge {
      font-size: 0.65rem;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      letter-spacing: 0.05em;

      &.method-get {
        background: rgba(59, 130, 246, 0.15);
        color: #60a5fa;
      }
      &.method-post {
        background: rgba(16, 185, 129, 0.15);
        color: #34d399;
      }
      &.method-put, &.method-patch {
        background: rgba(245, 158, 11, 0.15);
        color: #fbbf24;
      }
      &.method-delete {
        background: rgba(239, 68, 68, 0.15);
        color: #f87171;
      }
    }

    .url-path {
      color: var(--text-main);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-family: monospace;
      font-size: 0.8rem;
    }

    .item-meta {
      flex-shrink: 0;
      font-weight: 600;
      font-size: 0.775rem;

      .status-pending {
        color: var(--primary-400);
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .status-success {
        color: var(--success);
      }
      .status-error {
        color: var(--error);
      }
    }

    .spinner-sm {
      width: 10px;
      height: 10px;
      border: 2px solid rgba(99, 102, 241, 0.3);
      border-top-color: var(--primary-400);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .timeline-empty {
      padding: 20px;
      text-align: center;
      font-size: 0.8rem;
      color: var(--text-muted);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestTimelineComponent {
  readonly requestLogService = inject(RequestLogService);

  formatUrl(fullUrl: string): string {
    try {
      const url = new URL(fullUrl);
      return url.pathname.replace('/api', '') + url.search;
    } catch {
      return fullUrl.replace(/^.*\/api/, '');
    }
  }
}
