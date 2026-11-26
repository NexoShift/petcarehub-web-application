import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReferenceConsultationsApi } from './reference-consultations.api';

const consultation = (id: number, status: string, extra: object = {}) => ({
  id, veterinarianId: 3, reason: `Motivo ${id}`, status,
  startedAt: '2026-11-20T15:00:00Z', createdAt: `2026-11-${10 + id}T15:00:00Z`,
  diagnoses: [], treatments: [], ...extra,
});

describe('ReferenceConsultationsApi', () => {
  let api: ReferenceConsultationsApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(ReferenceConsultationsApi);
    http = TestBed.inject(HttpTestingController);
  });

  it('maps completed and in-progress visits with diagnosis, current treatment and vet', async () => {
    const result = firstValueFrom(api.byPet(22, '2026-11-25'));
    http.expectOne(`${environment.apiBaseUrl}/pets/22/clinical-consultations`).flush([
      consultation(1, 'CANCELLED'),
      consultation(2, 'COMPLETED', {
        diagnoses: [
          { description: 'Antiguo', primary: true, status: 'SUPERSEDED' },
          { description: 'Cistitis', primary: true, status: 'CURRENT' },
        ],
        treatments: [{ description: 'Meloxicam', instruction: 'Con comida', startDate: '2026-11-23', endDate: '2026-11-29', status: 'ACTIVE' }],
      }),
      consultation(3, 'CREATED'),
    ]);
    http.expectOne(`${environment.apiBaseUrl}/veterinarians/3`).flush({ id: 3, firstName: 'Jorge', lastName: 'Aguilar', licenseNumber: 'CMVP 1' });
    const [ref] = await result;
    expect(ref).toEqual({
      id: 2, code: '#C-2026-0002', date: '2026-11-20', reason: 'Motivo 2', diagnosis: 'Cistitis',
      treatment: { name: 'Meloxicam', route: 'Con comida', day: 3, totalDays: 7 },
      vet: { name: 'Jorge Aguilar', license: 'CMVP 1' },
    });
  });

  it('lists only the visits in progress for the assistant', async () => {
    const result = firstValueFrom(api.inProgressByPet(22));
    http.expectOne(`${environment.apiBaseUrl}/pets/22/clinical-consultations`).flush([
      consultation(4, 'IN_PROGRESS'), consultation(5, 'COMPLETED'),
    ]);
    expect(await result).toEqual([{ id: 4, reason: 'Motivo 4', date: '2026-11-20', veterinarianId: 3 }]);
  });

  it('returns an empty list when the request fails', async () => {
    const result = firstValueFrom(api.byPet(22));
    http.expectOne(`${environment.apiBaseUrl}/pets/22/clinical-consultations`).flush(null, { status: 403, statusText: 'Forbidden' });
    expect(await result).toEqual([]);
  });
});
