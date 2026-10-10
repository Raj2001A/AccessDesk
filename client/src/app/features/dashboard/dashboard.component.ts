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
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, switchMap, catchError, of, finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { RecordService, RecordQueryParams } from '../../core/services/record.service';
import { RequestLogService } from '../../core/services/request-log.service';
import { User, Role } from '../../core/models/user.model';
import { RecordItem } from '../../core/models/record.model';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table/data-table.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { RequestTimelineComponent } from '../../shared/components/request-timeline/request-timeline.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataTableComponent,
    BadgeComponent,
    SkeletonComponent,
    RequestTimelineComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly recordService = inject(RecordService);
  readonly requestLogService = inject(RequestLogService);
  private readonly destroyRef = inject(DestroyRef);

  readonly Role = Role;

  // Latency simulator options
  readonly latencyOptions = [
    { label: '⚡ Fast (0ms)', value: 0 },
    { label: '🐢 Slow (3s)', value: 3000 },
    { label: '🛑 Very Slow (8s)', value: 8000 },
  ];
  readonly selectedDelay = signal<number>(0);

  // User Profile State (Independent stream & skeleton)
  readonly userProfile = signal<User | null>(this.authService.currentUser());
  readonly isProfileLoading = signal<boolean>(false);
  readonly profileError = signal<string | null>(null);

  // Records Table State (Independent stream & skeleton)
  readonly records = signal<RecordItem[]>([]);
  readonly totalRecords = signal<number>(0);
  readonly page = signal<number>(1);
  readonly limit = signal<number>(10);
  readonly totalPages = signal<number>(1);
  readonly currentSort = signal<string>('createdAt:desc');
  readonly currentSearch = signal<string>('');
  readonly isRecordsLoading = signal<boolean>(false);
  readonly recordsError = signal<string | null>(null);

  // Subject for triggering record query with switchMap (automatically cancels stale requests)
  private readonly recordQuery$ = new Subject<RecordQueryParams>();

  // Columns for data table
  readonly tableColumns: TableColumn[] = [
    { key: 'title', label: 'Record Title', sortable: true, width: '28%' },
    { key: 'description', label: 'Summary', sortable: false, width: '38%' },
    { key: 'accessLevel', label: 'Access Level', sortable: true, width: '14%' },
    { key: 'createdBy', label: 'Creator', sortable: false, width: '10%' },
    { key: 'createdAt', label: 'Created At', sortable: true, width: '10%' },
  ];

  // Computed metrics for Stat Cards
  readonly hiddenRecordsCount = computed(() => {
    const totalVisible = this.totalRecords();
    const currentUser = this.userProfile();
    if (currentUser?.role === Role.Admin) {
      return 0; // Admins see all records
    }
    // Estimated hidden in database based on seed of ~40 records
    return Math.max(0, 40 - totalVisible);
  });

  ngOnInit(): void {
    this.setupRecordStream();
    this.loadInitialParallelData();
  }

  /**
   * Demonstrates parallel loading: fetches user profile and records
   * in parallel streams, each maintaining its own independent skeleton loader.
   */
  loadInitialParallelData(): void {
    this.isProfileLoading.set(true);
    this.profileError.set(null);

    // Stream 1: Fetch fresh profile
    this.userService
      .getProfile(this.selectedDelay())
      .pipe(
        finalize(() => this.isProfileLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          this.userProfile.set(res.user);
        },
        error: (err) => {
          this.profileError.set(err?.error?.message || 'Failed to load user profile');
        },
      });

    // Stream 2: Trigger initial records fetch
    this.triggerFetch();
  }

  /**
   * Sets up switchMap pipeline for records:
   * Any new fetch request instantly cancels in-flight/stale requests.
   */
  private setupRecordStream(): void {
    this.recordQuery$
      .pipe(
        switchMap((params) => {
          this.isRecordsLoading.set(true);
          this.recordsError.set(null);
          return this.recordService.getRecords(params).pipe(
            catchError((err) => {
              const msg =
                err?.error?.message ||
                (err.status === 0
                  ? 'Network connection error. Server may be unreachable.'
                  : 'Failed to fetch records');
              this.recordsError.set(msg);
              return of(null);
            }),
            finalize(() => {
              this.isRecordsLoading.set(false);
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res && res.success) {
          this.records.set(res.records);
          this.totalRecords.set(res.total);
          this.page.set(res.page);
          this.limit.set(res.limit);
          this.totalPages.set(res.totalPages);
        }
      });
  }

  triggerFetch(): void {
    this.recordQuery$.next({
      page: this.page(),
      limit: this.limit(),
      sort: this.currentSort(),
      search: this.currentSearch(),
      delay: this.selectedDelay(),
    });
  }

  onLatencyChange(delay: number): void {
    this.selectedDelay.set(delay);
    this.triggerFetch();
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
    this.triggerFetch();
  }

  onLimitChange(newLimit: number): void {
    this.limit.set(newLimit);
    this.page.set(1);
    this.triggerFetch();
  }

  onSortChange(newSort: string): void {
    this.currentSort.set(newSort);
    this.page.set(1);
    this.triggerFetch();
  }

  onSearchChange(newSearch: string): void {
    this.currentSearch.set(newSearch);
    this.page.set(1);
    this.triggerFetch();
  }
}
