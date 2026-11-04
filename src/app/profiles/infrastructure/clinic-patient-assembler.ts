import { ClinicPatient } from '../domain/model/clinic-patient.entity';
import type { ClinicPatientResource } from './clinic-patient.resource';

/**
 * Assembler for converting clinic patient API resources into domain entities.
 */
export class ClinicPatientAssembler {
  /**
   * Converts a clinic patient resource into a domain entity.
   *
   * @param resource - The clinic patient resource received from the API.
   * @returns The clinic patient entity.
   */
  static toEntityFromResource(resource: ClinicPatientResource): ClinicPatient {
    return new ClinicPatient(resource.id, resource.clinicId, resource.petId, resource.registeredAt);
  }

  /**
   * Converts clinic patient resources into domain entities.
   */
  static toEntitiesFromResources(resources: ClinicPatientResource[]): ClinicPatient[] {
    return resources.map((resource) => this.toEntityFromResource(resource));
  }
}
