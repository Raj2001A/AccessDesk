import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, Role, AccessLevel } from '../models/user.model';

export interface CreateUserPayload {
  userId: string;
  name: string;
  password: string;
  role: Role;
  accessLevel: AccessLevel;
  isActive?: boolean;
}

export interface UpdateUserPayload {
  name?: string;
  role?: Role;
  accessLevel?: AccessLevel;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);

  getProfile(delay?: number): Observable<{ success: boolean; user: User }> {
    let params = new HttpParams();
    if (delay !== undefined && delay >= 0) {
      params = params.set('delay', delay.toString());
    }
    return this.http.get<{ success: boolean; user: User }>(`${environment.apiUrl}/me`, { params });
  }

  getAllUsers(delay?: number): Observable<{ success: boolean; users: User[]; total: number }> {
    let params = new HttpParams();
    if (delay !== undefined && delay >= 0) {
      params = params.set('delay', delay.toString());
    }
    return this.http.get<{ success: boolean; users: User[]; total: number }>(
      `${environment.apiUrl}/users`,
      { params }
    );
  }

  createUser(payload: CreateUserPayload): Observable<{ success: boolean; message: string; user: User }> {
    return this.http.post<{ success: boolean; message: string; user: User }>(
      `${environment.apiUrl}/users`,
      payload
    );
  }

  updateUser(
    id: string,
    payload: UpdateUserPayload
  ): Observable<{ success: boolean; message: string; user: User }> {
    return this.http.put<{ success: boolean; message: string; user: User }>(
      `${environment.apiUrl}/users/${id}`,
      payload
    );
  }

  deleteUser(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${environment.apiUrl}/users/${id}`
    );
  }

  resetPassword(
    id: string,
    newPassword: string
  ): Observable<{ success: boolean; message: string }> {
    return this.http.patch<{ success: boolean; message: string }>(
      `${environment.apiUrl}/users/${id}/reset-password`,
      { newPassword }
    );
  }
}
