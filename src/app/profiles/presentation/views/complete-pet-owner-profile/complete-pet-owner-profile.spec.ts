import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import en from '../../../../../../public/i18n/en.json';
import es from '../../../../../../public/i18n/es.json';
import { IamStore } from '../../../../iam/application/iam.store';
import { PetOwnerStore } from '../../../application/pet-owner.store';
import { CompletePetOwnerProfile } from './complete-pet-owner-profile';

describe('CompletePetOwnerProfile (i18n)', () => {
  let fixture: ComponentFixture<CompletePetOwnerProfile>;
  let translate: TranslateService;
  const create = vi.fn();

  const html = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const text = (selector: string): string =>
    html().querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

  /** Cambia el idioma como lo hace LanguageStore y vuelve a pintar. */
  async function useLanguage(language: 'es' | 'en'): Promise<void> {
    translate.use(language);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function fillValidForm(): void {
    for (const [control, value] of [
      ['firstName', 'Ana'],
      ['lastName', 'Quispe'],
    ]) {
      const input = html().querySelector<HTMLInputElement>(`input[formControlName="${control}"]`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
  }

  async function submit(): Promise<void> {
    html().querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    create.mockReset();
    await TestBed.configureTestingModule({
      imports: [CompletePetOwnerProfile],
      providers: [
        provideRouter([]),
        provideTranslateService({ fallbackLang: 'es' }),
        {
          provide: IamStore,
          useValue: { currentUser: signal({ id: 1, email: 'ana@example.com' }) },
        },
        { provide: PetOwnerStore, useValue: { loading: signal(false), create } },
      ],
    }).compileComponents();

    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    translate = TestBed.inject(TranslateService);
    translate.setTranslation('es', es);
    translate.setTranslation('en', en);
    translate.use('es');

    fixture = TestBed.createComponent(CompletePetOwnerProfile);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('muestra la pantalla en español y la pasa a inglés al cambiar el idioma', async () => {
    expect(text('h1')).toBe('Completa tu perfil');
    expect(text('button[type="submit"]')).toContain('Crear mi perfil');

    await useLanguage('en');

    expect(text('h1')).toBe('Complete your profile');
    expect(text('button[type="submit"]')).toContain('Create my profile');
    expect(html().textContent).not.toMatch(/Nombres|Apellidos|Fotografía|Opcional/);
  });

  it('no deja claves sin resolver en pantalla', () => {
    expect(html().textContent).not.toMatch(/\b(profiles|auth)\.[a-zA-Z]+\.[a-zA-Z]+/);
  });

  it('avisa en el idioma activo cuando la imagen no es JPG, PNG ni WebP', async () => {
    const input = html().querySelector<HTMLInputElement>('input[type="file"]')!;
    Object.defineProperty(input, 'files', {
      value: [new File(['x'], 'foto.gif', { type: 'image/gif' })],
    });
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(text('p.error')).toBe('Selecciona una imagen JPG, PNG o WebP.');

    await useLanguage('en');
    expect(text('p.error')).toBe('Select a JPG, PNG or WebP image.');
  });

  it('si ya existe un perfil (409) lo dice en el idioma activo', async () => {
    create.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    fillValidForm();
    await submit();

    expect(text('[role="alert"]')).toBe('Ya existe un perfil para esta cuenta.');
    await useLanguage('en');
    expect(text('[role="alert"]')).toBe('A profile already exists for this account.');
  });

  it('ante otro error muestra el mensaje genérico traducido, no el texto en inglés del store', async () => {
    create.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    fillValidForm();
    await submit();

    expect(text('[role="alert"]')).toBe('No se pudo crear tu perfil. Inténtalo nuevamente.');
  });

  it('al reintentar borra el error anterior', async () => {
    create.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 500 })));
    create.mockReturnValueOnce(of({}));
    fillValidForm();
    await submit();
    expect(html().querySelector('[role="alert"]')).not.toBeNull();

    await submit();
    expect(html().querySelector('[role="alert"]')).toBeNull();
  });
});
