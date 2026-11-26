import { MedicalHistory } from '../model/medical-history.entity';
import { RecordAllergyCommand } from '../model/record-allergy.command';
import { RecordVaccinationCommand } from '../model/record-vaccination.command';

export interface MedicalHistoryRepository {
  findByPetId(petId: number): Promise<MedicalHistory>;
  /** Both return the whole updated history. */
  recordAllergy(command: RecordAllergyCommand): Promise<MedicalHistory>;
  recordVaccination(command: RecordVaccinationCommand): Promise<MedicalHistory>;
}
