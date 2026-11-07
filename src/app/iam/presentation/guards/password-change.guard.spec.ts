import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { IamStore } from '../../application/iam.store';
import { passwordChangeGuard, temporaryPasswordGuard } from './password-change.guard';

describe('passwordChangeGuard y temporaryPasswordGuard', () => {
  let http: HttpTestingController;
  let router: Router;

  const run = (guard: typeof passwordChangeGuard) =>
    TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));

  const signIn = (mustChangePassword: boolean) => {
    TestBed.inject(IamStore).signIn('vet@clinica.com', 'x').subscribe();
    http.expectOne(`${environment.apiBaseUrl}/authentication/sign-in`).flush({
      userId: 12, accountId: 4, accountType: 'CLINIC', email: 'vet@clinica.com',
      roles: ['ROLE_VETERINARIAN'], mustChangePassword, token: 'jwt',
    });
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  it('con contraseña temporal, el Shell manda a /change-password', () => {
    signIn(true);
    const result = run(passwordChangeGuard) as UrlTree;
    expect(router.serializeUrl(result)).toBe('/change-password');
    expect(run(temporaryPasswordGuard)).toBe(true);
  });

  it('con la contraseña ya cambiada, deja pasar al Shell y /change-password manda a /home', () => {
    signIn(false);
    expect(run(passwordChangeGuard)).toBe(true);
    expect(router.serializeUrl(run(temporaryPasswordGuard) as UrlTree)).toBe('/home');
  });

  it('sin sesión, /change-password manda a /sign-in', () => {
    expect(router.serializeUrl(run(temporaryPasswordGuard) as UrlTree)).toBe('/sign-in');
  });
});
