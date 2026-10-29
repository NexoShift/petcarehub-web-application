import { TestBed } from '@angular/core/testing';
import { provideHttpClient} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../enviroments/environment';
import { IamStore } from './iam-store'

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
  it('signIn guarda el token y deja al usuario con la sesion', () => {
    store.signIn('ana@gmail.com', 'password123').subscribe();

    http.expectOne(`${environment.apiBaseUrl}/authentication/sign-in`).flush({
      userId: 7, accountId: 3, accountType: 'PET_OWNER', email: 'ana@gmail.com', roles: ['ROLE_PET_OWNER'], token: 'jwt-de-prueba',

    });

    expect(store.isSignedIn()).toBe(true);
    expect(store.currentUser()?.email).toBe('ana@gmail.com');
    expect(localStorage.getItem('petcarehub.token')).toEqual('jwt-de-prueba');
  });

  it('signOut borra la sesion', () => {
    localStorage.setItem('petcarehub.token', 'x');
    store.signOut();
    expect(store.isSignedIn()).toBe(false);
    expect(localStorage.getItem('petcarehub.token')).toBe(null);
  });
})
