import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { Subject, of, throwError } from 'rxjs';
import { IamStore } from '../../../application/iam.store';
import { GoogleIdentityService } from '../../../infrastructure/google-identity.service';
import { GoogleSignInButton } from './google-sign-in-button';

describe('GoogleSignInButton', () => {
  let credential: (token: string) => void;
  let googleSignIn: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.fn>;

  function setup(enabled = true) {
    googleSignIn = vi.fn();
    navigate = vi.fn().mockResolvedValue(true);
    TestBed.configureTestingModule({
      imports: [GoogleSignInButton],
      providers: [
        provideTranslateService(),
        { provide: IamStore, useValue: { googleSignIn } },
        { provide: Router, useValue: { navigateByUrl: navigate } },
        {
          provide: GoogleIdentityService,
          useValue: {
            enabled,
            renderButton: (_el: HTMLElement, cb: (t: string) => void) => {
              credential = cb;
              return Promise.resolve();
            },
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(GoogleSignInButton);
    fixture.detectChanges();
    return fixture;
  }

  const user = (accountType: 'PET_OWNER' | 'CLINIC', mustChangePassword = false) =>
    ({ accountType, mustChangePassword }) as never;

  it('sin Client ID muestra el botón desactivado', () => {
    const fixture = setup(false);
    const button = fixture.nativeElement.querySelector('button.google-off') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('una cuenta existente entra a /home', () => {
    setup();
    googleSignIn.mockReturnValue(of({ user: user('PET_OWNER'), created: false }));
    credential('tok');
    expect(googleSignIn).toHaveBeenCalledWith('tok', undefined);
    expect(navigate).toHaveBeenCalledWith('/home');
  });

  it('una cuenta nueva va a completar su perfil', () => {
    setup();
    googleSignIn.mockReturnValue(of({ user: user('CLINIC'), created: true }));
    credential('tok');
    expect(navigate).toHaveBeenCalledWith('/profiles/clinic/complete');
  });

  it('con 422 pregunta el tipo de cuenta y reenvía el mismo token', () => {
    const fixture = setup();
    googleSignIn.mockReturnValueOnce(throwError(() => ({ status: 422 })));
    credential('tok');
    fixture.detectChanges();

    const owner = fixture.nativeElement.querySelector('#google-as-owner') as HTMLButtonElement;
    expect(owner).toBeTruthy();

    const reply = new Subject<{ user: never; created: boolean }>();
    googleSignIn.mockReturnValueOnce(reply);
    owner.click();
    expect(googleSignIn).toHaveBeenLastCalledWith('tok', 'PET_OWNER');
    reply.next({ user: user('PET_OWNER'), created: true });
    expect(navigate).toHaveBeenCalledWith('/profiles/pet-owner/complete');
  });

  it('con 401 muestra que Google no confirmó la cuenta', () => {
    const fixture = setup();
    googleSignIn.mockReturnValue(throwError(() => ({ status: 401 })));
    credential('tok');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.google-error').textContent).toContain('auth.google.invalid');
    expect(navigate).not.toHaveBeenCalled();
  });
});
