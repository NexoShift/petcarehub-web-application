import { ExamStatus } from '../enums/exam-status.enum';
import { CancelClinicalExamCommand } from '../model/cancel-clinical-exam.command';
import { ClinicalExam } from '../model/clinical-exam.entity';
import { ClinicalFile } from '../model/clinical-file.entity';
import { RegisterExamResultCommand } from '../model/register-exam-result.command';
import { RequestClinicalExamCommand } from '../model/request-clinical-exam.command';
import { UploadClinicalFileCommand } from '../model/upload-clinical-file.command';

export interface ClinicalExamsRepository {
  findByConsultationId(consultationId: number): Promise<ClinicalExam[]>;
  /** Worklist of the clinic of the authenticated veterinarian; null status = all. */
  findOfMyClinic(status: ExamStatus | null): Promise<ClinicalExam[]>;
  /** Exams of a pet (its owner sees only validated results). */
  findByPetId(petId: number): Promise<ClinicalExam[]>;
  findById(examId: number): Promise<ClinicalExam>;
  request(command: RequestClinicalExamCommand): Promise<ClinicalExam>;
  start(examId: number): Promise<ClinicalExam>;
  cancel(command: CancelClinicalExamCommand): Promise<ClinicalExam>;
  registerResult(command: RegisterExamResultCommand): Promise<ClinicalExam>;
  validateResult(examId: number): Promise<ClinicalExam>;
  complete(examId: number): Promise<ClinicalExam>;
  uploadFile(command: UploadClinicalFileCommand): Promise<ClinicalFile>;
  downloadFile(examId: number, fileId: number): Promise<Blob>;
}
