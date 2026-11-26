import { Observable } from 'rxjs';
import { ClinicalAssistance } from '../model/clinical-assistance.entity';
import { ClinicalBackground } from '../model/clinical-background';
import { RequestClinicalAssistanceCommand } from '../model/request-clinical-assistance.command';
import { DraftDecision } from '../model/soap-draft.entity';

/** Puerto del asistente clínico (vet). Los errores llegan como AssistantError. */
export abstract class ClinicalAssistanceRepository {
  abstract findBackgrounds(petId: number): Observable<ClinicalBackground[]>;
  abstract request(command: RequestClinicalAssistanceCommand): Observable<ClinicalAssistance>;
  /** null si la consulta aún no tiene asistencia (204). */
  abstract findByConsultationId(consultationId: number): Observable<ClinicalAssistance | null>;
  abstract regenerate(assistanceId: number): Observable<ClinicalAssistance>;
  abstract decide(assistanceId: number, draftId: number, decision: DraftDecision, editedText?: string | null): Observable<ClinicalAssistance>;
  abstract loadReport(reportUrl: string): Observable<Blob>;
}
