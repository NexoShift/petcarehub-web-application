import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PetOwner } from '../domain/model/pet-owner.entity';
import { Pet } from '../domain/model/pet.entity';
import { Clinic } from '../domain/model/clinic.entity';
import { Veterinarian } from '../domain/model/veterinarian.entity';
import { ClinicPatient } from '../domain/model/clinic-patient.entity';
import { ConsultingRoom } from '../domain/model/consulting-room.entity';
import { ConsultingRoomAssignment } from '../domain/model/consulting-room-assignment.entity';

import { PetOwnersApiEndpoint } from './pet-owners-api-endpoint';
import { PetsApiEndpoint } from './pets-api-endpoint';
import { ClinicsApiEndpoint } from './clinics-api-endpoint';
import { VeterinariansApiEndpoint } from './veterinarians-api-endpoint';
import { ClinicPatientsApiEndpoint } from './clinic-patients-api-endpoint';
import { ConsultingRoomsApiEndpoint } from './consulting-rooms-api-endpoint';
import { ConsultingRoomAssignmentsApiEndpoint } from './consulting-room-assignments-api-endpoint';

import type { CreatePetOwnerRequest } from './create-pet-owner.request';
import type { UpdatePetOwnerRequest } from './update-pet-owner.request';
import type { CreatePetRequest } from './create-pet.request';
import type { UpdatePetRequest } from './update-pet.request';
import type { PetSearchResource } from './pet-search.resource';
import type { CreateClinicRequest } from './create-clinic.request';
import type { UpdateClinicRequest } from './update-clinic.request';
import type { CreateVeterinarianRequest } from './create-veterinarian.request';
import type { UpdateVeterinarianRequest } from './update-veterinarian.request';
import type { CreateClinicPatientRequest } from './create-clinic-patient.request';
import type { CreateConsultingRoomRequest } from './create-consulting-room.request';
import type { UpdateConsultingRoomRequest } from './update-consulting-room.request';
import type { AssignVeterinarianRequest } from './assign-veterinarian.request';

/**
 * Provides access to the Profile bounded context API.
 *
 * @remarks
 * Coordinates the HTTP endpoints associated with profiles,
 * pets, clinics, veterinarians, patients and consulting rooms.
 */
@Injectable({
  providedIn: 'root',
})
export class ProfileApi {
  private readonly petOwnersEndpoint = inject(PetOwnersApiEndpoint);
  private readonly petsEndpoint = inject(PetsApiEndpoint);
  private readonly clinicsEndpoint = inject(ClinicsApiEndpoint);
  private readonly veterinariansEndpoint = inject(VeterinariansApiEndpoint);
  private readonly clinicPatientsEndpoint = inject(ClinicPatientsApiEndpoint);
  private readonly consultingRoomsEndpoint = inject(ConsultingRoomsApiEndpoint);
  private readonly assignmentsEndpoint = inject(ConsultingRoomAssignmentsApiEndpoint);

  // --------------------------------------------------
  // Pet Owners
  // --------------------------------------------------

  /**
   * Retrieves a pet owner using its IAM user identifier.
   */
  getPetOwnerByUserId(userId: number): Observable<PetOwner> {
    return this.petOwnersEndpoint.getByUserId(userId);
  }

  /**
   * Retrieves a pet owner by its profile identifier.
   */
  getPetOwnerById(ownerId: number): Observable<PetOwner> {
    return this.petOwnersEndpoint.getById(ownerId);
  }

  /**
   * Creates a pet owner profile.
   */
  createPetOwner(request: CreatePetOwnerRequest): Observable<PetOwner> {
    return this.petOwnersEndpoint.create(request);
  }

  /**
   * Updates a pet owner's personal information.
   */
  updatePetOwner(ownerId: number, request: UpdatePetOwnerRequest): Observable<PetOwner> {
    return this.petOwnersEndpoint.update(ownerId, request);
  }

  /**
   * Replaces a pet owner's profile image.
   */
  updatePetOwnerImage(ownerId: number, image: File): Observable<PetOwner> {
    return this.petOwnersEndpoint.updateImage(ownerId, image);
  }

  // --------------------------------------------------
  // Pets
  // --------------------------------------------------

  /**
   * Retrieves a pet by its identifier.
   */
  getPetById(petId: number): Observable<Pet> {
    return this.petsEndpoint.getById(petId);
  }

  /**
   * Retrieves all pets belonging to a pet owner.
   */
  getPetsByOwnerId(ownerId: number): Observable<Pet[]> {
    return this.petsEndpoint.getByOwnerId(ownerId);
  }

  /**
   * Searches for a pet using its unique code.
   */
  getPetByCode(petCode: string): Observable<PetSearchResource> {
    return this.petsEndpoint.getByPetCode(petCode);
  }

  /**
   * Creates a pet profile.
   */
  createPet(request: CreatePetRequest): Observable<Pet> {
    return this.petsEndpoint.create(request);
  }

  /**
   * Updates a pet's information.
   */
  updatePet(petId: number, request: UpdatePetRequest): Observable<Pet> {
    return this.petsEndpoint.update(petId, request);
  }

  /**
   * Replaces a pet's profile image.
   */
  updatePetImage(petId: number, image: File): Observable<Pet> {
    return this.petsEndpoint.updateImage(petId, image);
  }

  // --------------------------------------------------
  // Clinics
  // --------------------------------------------------

  /**
   * Retrieves a clinic by its profile identifier.
   */
  getClinicById(clinicId: number): Observable<Clinic> {
    return this.clinicsEndpoint.getById(clinicId);
  }

  /**
   * Retrieves a clinic using its IAM account identifier.
   */
  getClinicByAccountId(accountId: number): Observable<Clinic> {
    return this.clinicsEndpoint.getByAccountId(accountId);
  }

  /**
   * Creates a clinic profile.
   */
  createClinic(request: CreateClinicRequest): Observable<Clinic> {
    return this.clinicsEndpoint.create(request);
  }

  /**
   * Updates a clinic's institutional information.
   */
  updateClinic(clinicId: number, request: UpdateClinicRequest): Observable<Clinic> {
    return this.clinicsEndpoint.update(clinicId, request);
  }

  /**
   * Replaces a clinic's profile image.
   */
  updateClinicImage(clinicId: number, image: File): Observable<Clinic> {
    return this.clinicsEndpoint.updateImage(clinicId, image);
  }

  // --------------------------------------------------
  // Veterinarians
  // --------------------------------------------------

  /**
   * Retrieves a veterinarian by its profile identifier.
   */
  getVeterinarianById(veterinarianId: number): Observable<Veterinarian> {
    return this.veterinariansEndpoint.getById(veterinarianId);
  }

  /**
   * Retrieves a veterinarian using its IAM user identifier.
   */
  getVeterinarianByUserId(userId: number): Observable<Veterinarian> {
    return this.veterinariansEndpoint.getByUserId(userId);
  }

  /**
   * Retrieves veterinarian profiles belonging to a clinic.
   */
  getVeterinariansByClinicId(clinicId: number): Observable<Veterinarian[]> {
    return this.veterinariansEndpoint.getByClinicId(clinicId);
  }

  /**
   * Creates a veterinarian profile.
   */
  createVeterinarian(request: CreateVeterinarianRequest): Observable<Veterinarian> {
    return this.veterinariansEndpoint.create(request);
  }

  /**
   * Updates a veterinarian's professional information.
   */
  updateVeterinarian(
    veterinarianId: number,
    request: UpdateVeterinarianRequest,
  ): Observable<Veterinarian> {
    return this.veterinariansEndpoint.update(veterinarianId, request);
  }

  /**
   * Replaces a veterinarian's profile image.
   */
  updateVeterinarianImage(veterinarianId: number, image: File): Observable<Veterinarian> {
    return this.veterinariansEndpoint.updateImage(veterinarianId, image);
  }

  // --------------------------------------------------
  // Clinic Patients
  // --------------------------------------------------

  /**
   * Registers an existing pet as a clinic patient.
   */
  registerClinicPatient(
    clinicId: number,
    request: CreateClinicPatientRequest,
  ): Observable<ClinicPatient> {
    return this.clinicPatientsEndpoint.create(clinicId, request);
  }

  /**
   * Retrieves pets registered as patients of a clinic.
   */
  getPatientsByClinicId(clinicId: number): Observable<Pet[]> {
    return this.clinicPatientsEndpoint.getByClinicId(clinicId);
  }

  /**
   * Retrieves clinics where a pet is registered as a patient.
   */
  getClinicsByPetId(petId: number): Observable<Clinic[]> {
    return this.clinicPatientsEndpoint.getClinicsByPetId(petId);
  }

  // --------------------------------------------------
  // Consulting Rooms
  // --------------------------------------------------

  /**
   * Retrieves the consulting rooms of a clinic.
   */
  getConsultingRoomsByClinicId(clinicId: number): Observable<ConsultingRoom[]> {
    return this.consultingRoomsEndpoint.getByClinicId(clinicId);
  }

  /**
   * Retrieves a consulting room by its identifier.
   */
  getConsultingRoomById(clinicId: number, roomId: number): Observable<ConsultingRoom> {
    return this.consultingRoomsEndpoint.getById(clinicId, roomId);
  }

  /**
   * Creates a consulting room within a clinic.
   */
  createConsultingRoom(
    clinicId: number,
    request: CreateConsultingRoomRequest,
  ): Observable<ConsultingRoom> {
    return this.consultingRoomsEndpoint.create(clinicId, request);
  }

  /**
   * Updates a consulting room's information.
   */
  updateConsultingRoom(
    clinicId: number,
    roomId: number,
    request: UpdateConsultingRoomRequest,
  ): Observable<ConsultingRoom> {
    return this.consultingRoomsEndpoint.update(clinicId, roomId, request);
  }

  /**
   * Activates an existing consulting room.
   */
  activateConsultingRoom(clinicId: number, roomId: number): Observable<ConsultingRoom> {
    return this.consultingRoomsEndpoint.activate(clinicId, roomId);
  }

  /**
   * Deactivates an existing consulting room.
   */
  deactivateConsultingRoom(clinicId: number, roomId: number): Observable<ConsultingRoom> {
    return this.consultingRoomsEndpoint.deactivate(clinicId, roomId);
  }

  /**
   * Deletes a consulting room when permitted.
   */
  deleteConsultingRoom(clinicId: number, roomId: number): Observable<{ message: string }> {
    return this.consultingRoomsEndpoint.delete(clinicId, roomId);
  }

  // --------------------------------------------------
  // Consulting Room Assignments
  // --------------------------------------------------

  /**
   * Assigns a veterinarian to a consulting room.
   */
  assignVeterinarian(
    clinicId: number,
    request: AssignVeterinarianRequest,
  ): Observable<{ message: string }> {
    return this.assignmentsEndpoint.assign(clinicId, request);
  }

  /**
   * Retrieves all consulting room assignments of a clinic.
   */
  getAssignmentsByClinicId(clinicId: number): Observable<ConsultingRoomAssignment[]> {
    return this.assignmentsEndpoint.getByClinicId(clinicId);
  }

  /**
   * Retrieves the assignment history of a consulting room.
   */
  getAssignmentsByConsultingRoomId(
    clinicId: number,
    roomId: number,
  ): Observable<ConsultingRoomAssignment[]> {
    return this.assignmentsEndpoint.getByConsultingRoomId(clinicId, roomId);
  }

  /**
   * Retrieves the active assignment of a consulting room.
   */
  getActiveAssignmentByConsultingRoomId(
    clinicId: number,
    roomId: number,
  ): Observable<ConsultingRoomAssignment> {
    return this.assignmentsEndpoint.getActiveByConsultingRoomId(clinicId, roomId);
  }

  /**
   * Ends an active veterinarian assignment.
   */
  unassignVeterinarian(clinicId: number, assignmentId: number): Observable<{ message: string }> {
    return this.assignmentsEndpoint.unassign(clinicId, assignmentId);
  }
}
