import { AddClinicalFindingCommand } from '../model/add-clinical-finding.command';
import { CancelClinicalConsultationCommand } from '../model/cancel-clinical-consultation.command';
import { ClinicalConsultation } from '../model/clinical-consultation.entity';
import { CreateClinicalConsultationCommand } from '../model/create-clinical-consultation.command';
import { ReevaluateDiagnosisCommand } from '../model/reevaluate-diagnosis.command';
import { RegisterAnamnesisCommand } from '../model/register-anamnesis.command';
import { RegisterDiagnosisCommand } from '../model/register-diagnosis.command';
import { RegisterPhysiologicalAssessmentCommand } from '../model/register-physiological-assessment.command';
import { RegisterTreatmentCommand } from '../model/register-treatment.command';

/** Every operation answers with the whole consultation, as the API does. */
export interface ClinicalAttentionRepository {
  findByPetId(petId: number): Promise<ClinicalConsultation[]>;
  findById(consultationId: number): Promise<ClinicalConsultation>;
  create(command: CreateClinicalConsultationCommand): Promise<ClinicalConsultation>;
  start(consultationId: number): Promise<ClinicalConsultation>;
  registerAnamnesis(command: RegisterAnamnesisCommand): Promise<ClinicalConsultation>;
  registerPhysiologicalAssessment(
    command: RegisterPhysiologicalAssessmentCommand,
  ): Promise<ClinicalConsultation>;
  addClinicalFinding(command: AddClinicalFindingCommand): Promise<ClinicalConsultation>;
  registerDiagnosis(command: RegisterDiagnosisCommand): Promise<ClinicalConsultation>;
  reevaluateDiagnosis(command: ReevaluateDiagnosisCommand): Promise<ClinicalConsultation>;
  registerTreatment(command: RegisterTreatmentCommand): Promise<ClinicalConsultation>;
  complete(consultationId: number): Promise<ClinicalConsultation>;
  cancel(command: CancelClinicalConsultationCommand): Promise<ClinicalConsultation>;
}
