import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BadgeComponent } from '../badge/badge.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule, BadgeComponent, SkeletonComponent],
  template: `
    <div class="data-table-container glass-panel">
      <!-- Table Controls Bar -->
      <div class="table-toolbar">
        <div class="search-wrap">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            class="table-search-input"
            placeholder="Search records by title or description..."
            [ngModel]="searchTerm()"
            (ngModelChange)="onSearchInput($event)"
          />
          <button
            *ngIf="searchTerm()"
            type="button"
            class="search-clear-btn"
            (click)="clearSearch()"
            title="Clear search"
          >
            ✕
          </button>
        </div>

        <div class="toolbar-actions">
          <label class="limit-selector-label">
            <span>Show:</span>
            <select
              class="limit-select"
              [ngModel]="limit()"
              (ngModelChange)="limitChange.emit($event)"
            >
              <option [value]="5">5</option>
              <option [value]="10">10</option>
              <option [value]="20">20</option>
            </select>
          </label>
        </div>
      </div>

      <!-- Table Scroll Wrapper -->
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th
                *ngFor="let col of columns()"
                [style.width]="col.width || 'auto'"
                [class.sortable]="col.sortable"
                (click)="col.sortable ? toggleSort(col.key) : null"
              >
                <div class="th-content">
                  <span>{{ col.label }}</span>
                  <span *ngIf="col.sortable" class="sort-icon">
                    <span [class.active]="getSortField() === col.key && getSortDir() === 'asc'">▲</span>
                    <span [class.active]="getSortField() === col.key && getSortDir() === 'desc'">▼</span>
                  </span>
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            <!-- Skeleton Rows when loading -->
            <ng-container *ngIf="isLoading()">
              <tr *ngFor="let dummy of skeletonRows">
                <td *ngFor="let col of columns()">
                  <app-skeleton height="20px" width="80%"></app-skeleton>
                </td>
              </tr>
            </ng-container>

            <!-- Real Data Rows -->
            <ng-container *ngIf="!isLoading() && data().length > 0">
              <tr *ngFor="let row of data()">
                <td *ngFor="let col of columns()">
                  <!-- Special Column: Access Level Badge -->
                  <ng-container *ngIf="col.key === 'accessLevel'; else standardCell">
                    <app-badge [text]="row[col.key]"></app-badge>
                  </ng-container>

                  <!-- Standard Text Cell -->
                  <ng-template #standardCell>
                    <span *ngIf="col.key === 'createdAt'">
                      {{ row[col.key] | date: 'mediumDate' }}
                    </span>
                    <span *ngIf="col.key !== 'createdAt'">
                      {{ row[col.key] }}
                    </span>
                  </ng-template>
                </td>
              </tr>
            </ng-container>

            <!-- Empty State Row -->
            <tr *ngIf="!isLoading() && data().length === 0">
              <td [attr.colspan]="columns().length" class="empty-cell">
                <div class="empty-state">
                  <span class="empty-icon">📂</span>
                  <h4>No records found</h4>
                  <p>Try adjusting your search query or check your access permissions.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="table-pagination">
        <div class="pagination-info">
          Showing <strong>{{ startItem() }}</strong> to <strong>{{ endItem() }}</strong> of <strong>{{ total() }}</strong> records
        </div>

        <div class="pagination-controls">
          <button
            type="button"
            class="page-btn"
            [disabled]="page() <= 1 || isLoading()"
            (click)="pageChange.emit(page() - 1)"
            aria-label="Previous Page"
          >
            ← Prev
          </button>

          <span class="page-current">Page {{ page() }} of {{ totalPages() || 1 }}</span>

          <button
            type="button"
            class="page-btn"
            [disabled]="page() >= totalPages() || isLoading()"
            (click)="pageChange.emit(page() + 1)"
            aria-label="Next Page"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .data-table-container {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .table-toolbar {
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 1px solid var(--border-subtle);
      flex-wrap: wrap;
    }

    .search-wrap {
      position: relative;
      flex: 1;
      max-width: 440px;
      display: flex;
      align-items: center;

      .search-icon {
        position: absolute;
        left: 12px;
        font-size: 0.9rem;
        pointer-events: none;
        opacity: 0.6;
      }

      .table-search-input {
        width: 100%;
        padding: 9px 36px 9px 34px;
        background: var(--input-bg);
        border: 1px solid var(--input-border);
        border-radius: var(--radius-md);
        color: var(--text-main);
        font-size: 0.875rem;
        transition: var(--transition);

        &:focus {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
          outline: none;
        }
      }

      .search-clear-btn {
        position: absolute;
        right: 10px;
        background: transparent;
        color: var(--text-muted);
        font-size: 0.85rem;
        padding: 2px 6px;
        border-radius: var(--radius-sm);
        cursor: pointer;

        &:hover {
          color: var(--text-main);
        }
      }
    }

    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .limit-selector-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.825rem;
      color: var(--text-muted);
      font-weight: 600;

      .limit-select {
        background: var(--input-bg);
        border: 1px solid var(--input-border);
        color: var(--text-main);
        padding: 6px 12px;
        border-radius: var(--radius-sm);
        font-size: 0.825rem;
        cursor: pointer;
        outline: none;
      }
    }

    .table-responsive {
      overflow-x: auto;
      width: 100%;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.875rem;

      th {
        padding: 14px 20px;
        background: var(--bg-surface-alt);
        color: var(--text-muted);
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 1px solid var(--border-subtle);
        user-select: none;

        &.sortable {
          cursor: pointer;
          &:hover {
            color: var(--primary-500);
          }
        }

        .th-content {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .sort-icon {
          display: flex;
          flex-direction: column;
          font-size: 0.55rem;
          line-height: 0.8;
          color: var(--text-muted);

          span.active {
            color: var(--primary-500);
            font-weight: bold;
          }
        }
      }

      td {
        padding: 14px 20px;
        border-bottom: 1px solid var(--border-subtle);
        color: var(--text-main);
      }

      tbody tr {
        transition: background-color 0.15s ease;

        &:hover:not(:has(.empty-cell)) {
          background-color: var(--bg-surface-alt);
        }
      }
    }

    .empty-cell {
      padding: 48px 20px !important;
      text-align: center;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;

      .empty-icon {
        font-size: 2.2rem;
      }
      h4 {
        font-size: 1.1rem;
      }
      p {
        font-size: 0.85rem;
        color: var(--text-muted);
      }
    }

    .table-pagination {
      padding: 14px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid var(--border-subtle);
      flex-wrap: wrap;
      gap: 12px;

      .pagination-info {
        font-size: 0.825rem;
        color: var(--text-muted);
      }

      .pagination-controls {
        display: flex;
        align-items: center;
        gap: 12px;

        .page-btn {
          padding: 6px 14px;
          border-radius: var(--radius-sm);
          background: var(--bg-surface-alt);
          border: 1px solid var(--border-subtle);
          color: var(--text-main);
          font-size: 0.825rem;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);

          &:hover:not(:disabled) {
            background: var(--border-subtle);
            border-color: var(--primary-500);
          }

          &:disabled {
            opacity: 0.4;
            cursor: not-allowed;
          }
        }

        .page-current {
          font-size: 0.825rem;
          color: var(--text-muted);
          font-weight: 600;
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent implements OnDestroy {
  readonly columns = input.required<TableColumn[]>();
  readonly data = input.required<any[]>();
  readonly total = input.required<number>();
  readonly page = input.required<number>();
  readonly limit = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly isLoading = input<boolean>(false);
  readonly currentSort = input<string>('createdAt:desc');

  readonly pageChange = output<number>();
  readonly limitChange = output<number>();
  readonly sortChange = output<string>();
  readonly searchChange = output<string>();

  readonly searchTerm = signal<string>('');
  readonly skeletonRows = Array.from({ length: 5 });

  private searchDebounceTimer?: ReturnType<typeof setTimeout>;

  ngOnDestroy(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
  }

  readonly startItem = computed(() => {
    if (this.total() === 0) return 0;
    return (this.page() - 1) * this.limit() + 1;
  });

  readonly endItem = computed(() => {
    return Math.min(this.page() * this.limit(), this.total());
  });

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
    clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => {
      this.searchChange.emit(value);
    }, 300);
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.searchChange.emit('');
  }

  getSortField(): string {
    return this.currentSort().split(':')[0] || '';
  }

  getSortDir(): string {
    return this.currentSort().split(':')[1] || 'desc';
  }

  toggleSort(field: string): void {
    const currentF = this.getSortField();
    const currentD = this.getSortDir();

    let newDir = 'desc';
    if (currentF === field) {
      newDir = currentD === 'desc' ? 'asc' : 'desc';
    }
    this.sortChange.emit(`${field}:${newDir}`);
  }
}
