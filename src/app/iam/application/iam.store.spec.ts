import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { IamStore } from './iam.store';

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

  it('signIn guarda el token y deja al usuario con sesión', () => {
    store.signIn('ana@correo.com', 'secreto123').subscribe();

    http.expectOne(`${environment.apiBaseUrl}/authentication/sign-in`).flush({
      userId: 7, accountId: 3, accountType: 'PET_OWNER', email: 'ana@correo.com',
      roles: ['ROLE_PET_OWNER'], token: 'jwt-de-prueba',
    });

    expect(store.isSignedIn()).toBe(true);
    expect(store.currentUser()?.email).toBe('ana@correo.com');
    expect(localStorage.getItem('petcarehub.token')).toBe('jwt-de-prueba');
  });

  it('signOut borra la sesión', () => {
    localStorage.setItem('petcarehub.token', 'x');
    store.signOut();
    expect(store.isSignedIn()).toBe(false);
    expect(localStorage.getItem('petcarehub.token')).toBeNull();
  });
});
