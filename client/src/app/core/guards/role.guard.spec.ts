import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { roleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';

describe('roleGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      isAuthenticated: jasmine.createSpy().and.returnValue(false),
      isAdmin: jasmine.createSpy().and.returnValue(false),
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });
  });

  it('should allow access (return true) when user is authenticated and is Admin', () => {
    (authServiceSpy as any).isAuthenticated.and.returnValue(true);
    (authServiceSpy as any).isAdmin.and.returnValue(true);

    const route = {} as ActivatedRouteSnapshot;
    const state = { url: '/admin/users' } as RouterStateSnapshot;

    const result = TestBed.runInInjectionContext(() => roleGuard(route, state));
    expect(result).toBeTrue();
  });

  it('should redirect to /dashboard when user is authenticated but NOT Admin', () => {
    (authServiceSpy as any).isAuthenticated.and.returnValue(true);
    (authServiceSpy as any).isAdmin.and.returnValue(false);

    const route = {} as ActivatedRouteSnapshot;
    const state = { url: '/admin/users' } as RouterStateSnapshot;

    const result = TestBed.runInInjectionContext(() => roleGuard(route, state));

    expect(result instanceof UrlTree).toBeTrue();
    const tree = result as UrlTree;
    expect(tree.toString()).toBe('/dashboard');
  });

  it('should redirect to /dashboard when user is unauthenticated', () => {
    (authServiceSpy as any).isAuthenticated.and.returnValue(false);
    (authServiceSpy as any).isAdmin.and.returnValue(false);

    const route = {} as ActivatedRouteSnapshot;
    const state = { url: '/admin/users' } as RouterStateSnapshot;

    const result = TestBed.runInInjectionContext(() => roleGuard(route, state));

    expect(result instanceof UrlTree).toBeTrue();
    const tree = result as UrlTree;
    expect(tree.toString()).toBe('/dashboard');
  });
});
