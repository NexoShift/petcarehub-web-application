import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { IamStore } from './iam.store';

const API = environment.apiBaseUrl;

describe('IamStore', () => {
  let store: IamStore;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(IamStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('signIn guarda el token y deja al usuario con sesión', () => {
    store.signIn('ana@correo.com', 'secreto123').subscribe();

    http.expectOne(`${API}/authentication/sign-in`).flush({
      userId: 7,
      accountId: 3,
      accountType: 'PET_OWNER',
      email: 'ana@correo.com',
      roles: ['ROLE_PET_OWNER'],
      mustChangePassword: false,
      token: 'jwt-de-prueba',
    });

    expect(store.isSignedIn()).toBe(true);
    expect(store.currentUser()?.email).toBe('ana@correo.com');
    expect(store.currentUser()?.mustChangePassword).toBe(false);
    expect(localStorage.getItem('petcarehub.token')).toBe('jwt-de-prueba');
  });

  it('signUp envía solo email, contraseña y tipo de cuenta', () => {
    store.signUp('ana@correo.com', 'secreto123', 'PET_OWNER').subscribe();

    const req = http.expectOne(`${API}/authentication/sign-up`);
    expect(req.request.body).toEqual({
      email: 'ana@correo.com',
      password: 'secreto123',
      accountType: 'PET_OWNER',
    });
    req.flush({
      id: 7,
      accountId: 3,
      accountType: 'PET_OWNER',
      email: 'ana@correo.com',
      accessRole: 'HOLDER',
      status: 'ACTIVE',
      roles: ['ROLE_PET_OWNER'],
      mustChangePassword: false,
    });
  });

  it('signUpAndSignIn crea la cuenta y entra de una vez (paso 1 del onboarding)', () => {
    let userId: number | undefined;
    store
      .signUpAndSignIn('clinica@correo.com', 'secreto123', 'CLINIC')
      .subscribe((u) => (userId = u.id));

    http.expectOne(`${API}/authentication/sign-up`).flush({
      id: 9,
      accountId: 4,
      accountType: 'CLINIC',
      email: 'clinica@correo.com',
      accessRole: 'HOLDER',
      status: 'ACTIVE',
      roles: ['ROLE_CLINIC_ADMIN', 'ROLE_VETERINARIAN'],
      mustChangePassword: false,
    });
    const signIn = http.expectOne(`${API}/authentication/sign-in`);
    expect(signIn.request.body).toEqual({ email: 'clinica@correo.com', password: 'secreto123' });
    signIn.flush({
      userId: 9,
      accountId: 4,
      accountType: 'CLINIC',
      email: 'clinica@correo.com',
      roles: ['ROLE_CLINIC_ADMIN', 'ROLE_VETERINARIAN'],
      mustChangePassword: false,
      token: 'jwt',
    });

    expect(userId).toBe(9);
    expect(store.isSignedIn()).toBe(true);
    expect(store.currentUser()?.isClinicAdmin).toBe(true);
  });

  it('un veterinario creado por su clínica entra con mustChangePassword y lo limpia al cambiarla', () => {
    store.signIn('vet@clinica.com', 'Temporal2026').subscribe();
    http.expectOne(`${API}/authentication/sign-in`).flush({
      userId: 12,
      accountId: 4,
      accountType: 'CLINIC',
      email: 'vet@clinica.com',
      roles: ['ROLE_VETERINARIAN'],
      mustChangePassword: true,
      token: 'jwt',
    });
    expect(store.currentUser()?.mustChangePassword).toBe(true);

    store.changePassword('Temporal2026', 'NuevaClave2026').subscribe();
    const req = http.expectOne(`${API}/users/12/password`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      currentPassword: 'Temporal2026',
      newPassword: 'NuevaClave2026',
    });
    req.flush({ message: 'Password updated successfully' });

    expect(store.currentUser()?.mustChangePassword).toBe(false);
    expect(store.currentUser()?.id).toBe(12);
  });

  it('signOut borra la sesión', () => {
    localStorage.setItem('petcarehub.token', 'x');
    store.signOut();
    expect(store.isSignedIn()).toBe(false);
    expect(localStorage.getItem('petcarehub.token')).toBeNull();
  });
});
