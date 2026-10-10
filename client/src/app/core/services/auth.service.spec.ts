import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Role, AccessLevel, User } from '../models/user.model';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockUser: User = {
    userId: 'admin1',
    name: 'Alice Admin',
    role: Role.Admin,
    accessLevel: AccessLevel.Restricted,
    isActive: true,
  };

  beforeEach(() => {
    localStorage.clear();
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy },
      ],
    });

    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('should be created and default to unauthenticated when storage is empty', () => {
    expect(service).toBeTruthy();
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.currentUser()).toBeNull();
    expect(service.token()).toBeNull();
  });

  it('should store token and user in signals and localStorage on login success', () => {
    const mockResponse = {
      token: 'jwt_test_token_123',
      user: mockUser,
    };

    service
      .login({ userId: 'admin1', password: 'password123', role: Role.Admin })
      .subscribe((res) => {
        expect(res.token).toBe('jwt_test_token_123');
      });

    const req = httpTesting.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.isAdmin()).toBeTrue();
    expect(service.token()).toBe('jwt_test_token_123');
    expect(service.currentUser()?.userId).toBe('admin1');
    expect(localStorage.getItem('accessdesk_token')).toBe('jwt_test_token_123');
  });

  it('should clear signals, remove localStorage items, and navigate to /login on logout', () => {
    // Simulate active session
    service.token.set('temp_token');
    service.currentUser.set(mockUser);
    localStorage.setItem('accessdesk_token', 'temp_token');

    service.logout();

    expect(service.token()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem('accessdesk_token')).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });
});
