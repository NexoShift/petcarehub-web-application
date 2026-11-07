import { Injectable, inject } from '@angular/core';
import { Observable, catchError, delay, map, of, switchMap } from 'rxjs';
import { IamStore } from '../../iam';
import { ProfileApi } from '../../profiles/infrastructure/profile-api';
import { Pet } from '../../profiles/domain/model/pet.entity';
import { OwnerDashboard, PetSummary } from '../domain/model/dashboard/owner-dashboard';
import { VetDashboard } from '../domain/model/dashboard/vet-dashboard';
import { OWNER_DASHBOARD_DEMO } from './demo/owner-dashboard.demo';
import { VET_DASHBOARD_DEMO } from './demo/vet-dashboard.demo';

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
    return of(VET_DASHBOARD_DEMO).pipe(delay(250));
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
