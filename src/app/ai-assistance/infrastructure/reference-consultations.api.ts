import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ActiveConsultation, ReferenceConsultation } from '../domain/model/owner-clinical-context';

/** Lo que usa este contexto de ClinicalConsultationResource (Clinical Attention). */
interface ConsultationResponse {
  id: number;
  veterinarianId: number;
  reason: string;
  status: string;
  startedAt: string | null;
  createdAt: string;
  diagnoses: { description: string; primary: boolean; status: string }[] | null;
  treatments?: { description: string; instruction: string; startDate: string; endDate: string | null; status: string }[] | null;
}

/** Lo que usa este contexto de VeterinarianResource (Profiles). */
interface VeterinarianResponse {
  id: number;
  firstName: string;
  lastName: string;
  licenseNumber: string | null;
}

const DAY_MS = 86_400_000;
const isoDay = (value: string) => value.slice(0, 10);
const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);

/**
 * Consultas de la mascota vistas desde AI Assistance (capa anticorrupción):
 *   byPet():           panel "Contexto clínico activo" del dueño (GET /pets/{petId}/clinical-consultations
 *                      + GET /veterinarians/{id} para el nombre del vet). Más nueva primero.
 *   inProgressByPet(): consultas en curso para el selector del asistente del vet.
 */
@Injectable({ providedIn: 'root' })
export class ReferenceConsultationsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  byPet(petId: number, today = new Date().toLocaleDateString('en-CA')): Observable<ReferenceConsultation[]> {
    return this.consultations(petId).pipe(
      map(list => list.filter(c => c.status === 'COMPLETED' || c.status === 'IN_PROGRESS')),
      switchMap(list => {
        const vetIds = [...new Set(list.map(c => c.veterinarianId))];
        if (!vetIds.length) return of([]);
        return forkJoin(vetIds.map(id => this.veterinarian(id))).pipe(
          map(vets => {
            const byId = new Map(vets.filter(v => v !== null).map(v => [v.id, v]));
            return list.map(c => toReference(c, byId.get(c.veterinarianId) ?? null, today));
          }),
        );
      }),
    );
  }

  inProgressByPet(petId: number): Observable<ActiveConsultation[]> {
    return this.consultations(petId).pipe(
      map(list =>
        list
          .filter(c => c.status === 'IN_PROGRESS')
          .map(c => ({ id: c.id, reason: c.reason, date: isoDay(c.startedAt ?? c.createdAt), veterinarianId: c.veterinarianId })),
      ),
    );
  }

  private consultations(petId: number): Observable<ConsultationResponse[]> {
    return this.http.get<ConsultationResponse[]>(`${this.baseUrl}/pets/${petId}/clinical-consultations`).pipe(
      map(list => [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
      catchError(() => of([])),
    );
  }

  private veterinarian(id: number): Observable<VeterinarianResponse | null> {
    return this.http.get<VeterinarianResponse>(`${this.baseUrl}/veterinarians/${id}`).pipe(catchError(() => of(null)));
  }
}

function toReference(c: ConsultationResponse, vet: VeterinarianResponse | null, today: string): ReferenceConsultation {
  const date = isoDay(c.startedAt ?? c.createdAt);
  const current = (c.diagnoses ?? []).filter(d => d.status === 'CURRENT');
  const diagnosis = (current.find(d => d.primary) ?? current[0])?.description ?? '';
  const treatments = c.treatments ?? [];
  // El tratamiento vigente hoy; si no hay, el último indicado
  const t =
    treatments.find(x => x.status === 'ACTIVE' && x.startDate <= today && (!x.endDate || x.endDate >= today)) ??
    treatments[treatments.length - 1];
  return {
    id: c.id,
    code: `#C-${date.slice(0, 4)}-${String(c.id).padStart(4, '0')}`,
    date,
    reason: c.reason,
    diagnosis,
    treatment: t
      ? {
          name: t.description,
          route: t.instruction,
          day: Math.max(1, Math.min(daysBetween(t.startDate, today) + 1, t.endDate ? daysBetween(t.startDate, t.endDate) + 1 : Infinity)),
          totalDays: t.endDate ? daysBetween(t.startDate, t.endDate) + 1 : null,
        }
      : null,
    vet: { name: vet ? `${vet.firstName} ${vet.lastName}` : '', license: vet?.licenseNumber ?? '' },
  };
}
