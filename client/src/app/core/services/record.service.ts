import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, retry, timer } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedRecordsResponse } from '../models/record.model';

export interface RecordQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  delay?: number;
}

@Injectable({
  providedIn: 'root',
})
export class RecordService {
  private readonly http = inject(HttpClient);

  getRecords(options: RecordQueryParams = {}): Observable<PaginatedRecordsResponse> {
    let params = new HttpParams();

    if (options.page !== undefined) {
      params = params.set('page', options.page.toString());
    }
    if (options.limit !== undefined) {
      params = params.set('limit', options.limit.toString());
    }
    if (options.sort) {
      params = params.set('sort', options.sort);
    }
    if (options.search && options.search.trim()) {
      params = params.set('search', options.search.trim());
    }
    if (options.delay !== undefined && options.delay >= 0) {
      params = params.set('delay', options.delay.toString());
    }

    return this.http
      .get<PaginatedRecordsResponse>(`${environment.apiUrl}/records`, { params })
      .pipe(
        // Retry GET requests up to 2 times with exponential backoff on transient errors
        retry({
          count: 2,
          delay: (error, retryCount) => {
            // Do not retry 4xx client errors (e.g. 401, 403, 404)
            if (error.status >= 400 && error.status < 500) {
              throw error;
            }
            return timer(retryCount * 800);
          },
        })
      );
  }
}
