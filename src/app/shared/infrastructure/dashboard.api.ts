import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { IamStore } from '../../iam';
import { ProfileApi } from '../../profiles/infrastructure/profile-api';
import { Pet } from '../../profiles/domain/model/pet.entity';
import { OwnerDashboard, PetSummary } from '../domain/model/dashboard/owner-dashboard';
import { OWNER_DASHBOARD_DEMO } from './demo/owner-dashboard.demo';
import { VET_DASHBOARD_DEMO } from './demo/vet-dashboard.demo';
import { PetOwner } from '../../profiles/domain/model/pet-owner.entity';
import { TodayPatient, VetDashboard } from '../domain/model/dashboard/vet-dashboard';

@Injectable({ providedIn: 'root' })
export class DashboardApi {
  private readonly iam = inject(IamStore);
  private readonly profiles = inject(ProfileApi);

  getOwnerDashboard(): Observable<OwnerDashboard> {
    const user = this.iam.currentUser();
    if (!user) return of(OWNER_DASHBOARD_DEMO);

    return this.profiles.getPetOwnerByUserId(user.id).pipe(
      switchMap((owner) =>
        this.profiles.getPetsByOwnerId(owner.id).pipe(
          catchError(() => of([] as Pet[])),
          map((pets) => ({
            ...OWNER_DASHBOARD_DEMO, // lo que aún no tiene backend
            ownerFirstName: owner.firstName, // REAL
            pets: pets.map(toPetSummary), // REAL
          })),
        ),
      ),
    );
  }

  getVetDashboard(): Observable<VetDashboard> {
    const user = this.iam.currentUser();
    if (!user) return of(VET_DASHBOARD_DEMO);

    // admin y vets comparten accountId → misma clínica
    const clinic$ = this.profiles.getClinicByAccountId(user.accountId);
    const vetName$ = this.profiles.getVeterinarianByUserId(user.id).pipe(
      map((vet) => vet.lastName),
      catchError(() => of(user.email.split('@')[0])), // admin sin perfil de vet
    );

    return forkJoin({ clinic: clinic$, vetName: vetName$ }).pipe(
      switchMap(({ clinic, vetName }) =>
        this.profiles.getPatientsByClinicId(clinic.id).pipe(
          catchError(() => of([] as Pet[])),
          switchMap((pets) => this.withOwners(pets)),
          map((patients) => ({
            ...VET_DASHBOARD_DEMO,
            vetLastName: vetName,
            clinic: clinic.name,
            scheduledToday: patients.length,
            waitingNow: 0,
            syncedAt: new Date().toLocaleTimeString('es-PE', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            patients,
          })),
        ),
      ),
    );
  }

  private withOwners(pets: Pet[]): Observable<TodayPatient[]> {
    if (pets.length === 0) return of([]);
    const ownerIds = [...new Set(pets.map((p) => p.ownerId))];
    const owners$ = ownerIds.map((id) =>
      this.profiles.getPetOwnerById(id).pipe(catchError(() => of(null as PetOwner | null))),
    );
    return forkJoin(owners$).pipe(
      map((owners) => {
        const byId = new Map(owners.filter((o) => o !== null).map((o) => [o!.id, o!]));
        return pets.map((pet) => toTodayPatient(pet, byId.get(pet.ownerId) ?? null));
      }),
    );
  }
}

function toPetSummary(pet: Pet): PetSummary {
  return {
    id: pet.id,
    name: pet.name,
    species: `enums.species.${pet.species}`, // la vista lo traduce: Canino, Felino
    breed: pet.breed ?? '',
    ageYears: ageInYears(pet.birthDate),
    photoUrl: pet.profileImageUrl ?? undefined,
    active: true,
    verified: false,
    tags: [],
  };
}

const SPECIES_LABEL: Record<Pet['species'], TodayPatient['species']> = {
  DOG: 'Canino',
  CAT: 'Felino',
  OTHER: 'Otro',
};

function toTodayPatient(pet: Pet, owner: PetOwner | null): TodayPatient {
  return {
    code: `#${pet.petCode}`,
    name: pet.name,
    species: SPECIES_LABEL[pet.species],
    breed: pet.breed ?? '',
    ageYears: ageInYears(pet.birthDate),
    photoUrl: pet.profileImageUrl ?? undefined,
    ownerName: owner ? `${owner.firstName} ${owner.lastName}` : '—',
    ownerPhone: owner?.phoneNumber ?? '',
    status: 'ok',
    statusText: 'Paciente registrado en la clínica',
    noteTitle: '',
    note: '',
    primaryAction: 'Nueva consulta',
  };
}

function ageInYears(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const born = new Date(birthDate);
  const today = new Date();
  let years = today.getFullYear() - born.getFullYear();
  if (
    today.getMonth() < born.getMonth() ||
    (today.getMonth() === born.getMonth() && today.getDate() < born.getDate())
  )
    years--;
  return Math.max(years, 0);
}
