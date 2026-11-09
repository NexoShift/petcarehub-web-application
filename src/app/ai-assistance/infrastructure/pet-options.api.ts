import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IamStore } from '../../iam';
import { PetOption } from '../domain/model/pet-option';

/** Lo que devuelve Profiles para una mascota (PetResource). Solo lo que usa esta pantalla. */
interface PetResponse {
  id: number;
  name: string;
  species: string | null;
  breed: string | null;
  birthDate: string | null;
}

interface IdResponse {
  id: number;
}

/**
 * De dónde salen las mascotas que se pueden elegir: el contexto Profiles.
 *   ownerPets():   GET /pet-owners?userId={usuario} → GET /pet-owners/{id}/pets
 *   vetPatients(): GET /clinics?accountId={cuenta}  → GET /clinics/{id}/patients
 * Si el usuario aún no tiene perfil (404) devuelve una lista vacía y la pantalla lo avisa.
 */
@Injectable({ providedIn: 'root' })
export class PetOptionsApi {
  private readonly http = inject(HttpClient);
  private readonly iam = inject(IamStore);
  private readonly baseUrl = environment.apiBaseUrl;

  ownerPets(): Observable<PetOption[]> {
    const user = this.iam.currentUser();
    if (!user) return of([]);
    return this.http.get<IdResponse>(`${this.baseUrl}/pet-owners`, { params: { userId: user.id } }).pipe(
      switchMap(owner => this.http.get<PetResponse[]>(`${this.baseUrl}/pet-owners/${owner.id}/pets`)),
      map(pets => pets.map(toPetOption)),
      catchError(() => of([])),
    );
  }

  vetPatients(): Observable<PetOption[]> {
    const user = this.iam.currentUser();
    if (!user) return of([]);
    return this.http.get<IdResponse>(`${this.baseUrl}/clinics`, { params: { accountId: user.accountId } }).pipe(
      switchMap(clinic => this.http.get<PetResponse[]>(`${this.baseUrl}/clinics/${clinic.id}/patients`)),
      map(pets => pets.map(toPetOption)),
      catchError(() => of([])),
    );
  }
}

function toPetOption(pet: PetResponse): PetOption {
  const species = pet.species === 'DOG' || pet.species === 'CAT' ? pet.species : 'OTHER';
  return { id: pet.id, name: pet.name, species, breed: pet.breed ?? '', ageYears: ageInYears(pet.birthDate) };
}

function ageInYears(birthDate: string | null): number {
  if (!birthDate) return 0;
  const born = new Date(`${birthDate}T00:00:00`);
  const today = new Date();
  let years = today.getFullYear() - born.getFullYear();
  if (today < new Date(today.getFullYear(), born.getMonth(), born.getDate())) years--;
  return Math.max(0, years);
}
