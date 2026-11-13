import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiError } from '../../../shared/domain/api-error';
import { AddClinicalFindingCommand } from '../../domain/model/add-clinical-finding.command';
import { CancelClinicalConsultationCommand } from '../../domain/model/cancel-clinical-consultation.command';
import { ClinicalAttentionErrorCode } from '../../domain/model/clinical-attention-error';
import { ClinicalConsultation } from '../../domain/model/clinical-consultation.entity';
import { CreateClinicalConsultationCommand } from '../../domain/model/create-clinical-consultation.command';
import { ReevaluateDiagnosisCommand } from '../../domain/model/reevaluate-diagnosis.command';
import { RegisterAnamnesisCommand } from '../../domain/model/register-anamnesis.command';
import { RegisterDiagnosisCommand } from '../../domain/model/register-diagnosis.command';
import { RegisterPhysiologicalAssessmentCommand } from '../../domain/model/register-physiological-assessment.command';
import { ClinicalAttentionRepository } from '../../domain/repositories/clinical-attention.repository';
import {
  ErrorContext,
  toClinicalAttentionError,
  toClinicalConsultation,
} from '../acl/clinical-attention-assemblers';
import { ClinicalConsultationResponse } from '../acl/clinical-attention-responses';
import { RegisterTreatmentCommand } from '../../domain/model/register-treatment.command';

export class HttpClinicalAttentionRepository implements ClinicalAttentionRepository {
  private readonly http = inject(HttpClient);
  private readonly consultationsUrl = `${environment.apiBaseUrl}/clinical-consultations`;

  async findByPetId(petId: number): Promise<ClinicalConsultation[]> {
    const url = `${environment.apiBaseUrl}/pets/${petId}/clinical-consultations`;
    const responses = await this.send(this.http.get<ClinicalConsultationResponse[]>(url));
    return responses.map(toClinicalConsultation);
  }

  async findById(consultationId: number): Promise<ClinicalConsultation> {
    return this.read(this.http.get<ClinicalConsultationResponse>(this.url(consultationId)));
  }

  create(command: CreateClinicalConsultationCommand): Promise<ClinicalConsultation> {
    const body = {
      petId: command.petId,
      clinicId: command.clinicId,
      consultingRoomId: command.consultingRoomId,
      reason: command.reason,
    };
    return this.read(this.http.post<ClinicalConsultationResponse>(this.consultationsUrl, body), {
      notFound: ClinicalAttentionErrorCode.PetNotFound,
    });
  }

  start(consultationId: number): Promise<ClinicalConsultation> {
    return this.transition(consultationId, 'start');
  }

  registerAnamnesis(command: RegisterAnamnesisCommand): Promise<ClinicalConsultation> {
    const body = {
      chiefComplaint: command.chiefComplaint,
      evolutionTime: command.evolutionTime,
      symptoms: command.symptoms,
      diet: command.diet,
      behavior: command.behavior,
      previousTreatments: command.previousTreatments,
      ownerObservations: command.ownerObservations,
    };
    return this.read(
      this.http.post<ClinicalConsultationResponse>(
        this.url(command.consultationId, 'anamnesis'),
        body,
      ),
    );
  }

  registerPhysiologicalAssessment(
    command: RegisterPhysiologicalAssessmentCommand,
  ): Promise<ClinicalConsultation> {
    const body = {
      weightKg: command.weightKg,
      temperatureCelsius: command.temperatureCelsius,
      heartRateBpm: command.heartRateBpm,
      respiratoryRateBpm: command.respiratoryRateBpm,
      bodyConditionScore: command.bodyConditionScore,
      hydrationStatus: command.hydrationStatus,
      mucousMembranes: command.mucousMembranes,
      capillaryRefillTimeSeconds: command.capillaryRefillTimeSeconds,
      observations: command.observations,
    };
    const url = this.url(command.consultationId, 'physiological-assessments');
    return this.read(this.http.post<ClinicalConsultationResponse>(url, body));
  }

  addClinicalFinding(command: AddClinicalFindingCommand): Promise<ClinicalConsultation> {
    const body = {
      bodySystem: command.bodySystem,
      description: command.description,
      severity: command.severity,
    };
    return this.read(
      this.http.post<ClinicalConsultationResponse>(
        this.url(command.consultationId, 'findings'),
        body,
      ),
    );
  }

  registerDiagnosis(command: RegisterDiagnosisCommand): Promise<ClinicalConsultation> {
    const body = {
      description: command.description,
      type: command.type,
      primary: command.primary,
      differentialDiagnoses: command.differentialDiagnoses,
      rationale: command.rationale,
    };
    return this.read(
      this.http.post<ClinicalConsultationResponse>(
        this.url(command.consultationId, 'diagnoses'),
        body,
      ),
      { conflict: ClinicalAttentionErrorCode.DiagnosisConflict },
    );
  }

  reevaluateDiagnosis(command: ReevaluateDiagnosisCommand): Promise<ClinicalConsultation> {
    const body = {
      description: command.description,
      type: command.type,
      differentialDiagnoses: command.differentialDiagnoses,
      rationale: command.rationale,
    };
    const url = this.url(command.consultationId, `diagnoses/${command.diagnosisId}/reevaluations`);
    return this.read(this.http.post<ClinicalConsultationResponse>(url, body), {
      conflict: ClinicalAttentionErrorCode.DiagnosisConflict,
    });
  }

  registerTreatment(command:RegisterTreatmentCommand):Promise<ClinicalConsultation> {
    const body = {
      description: command.description,
      instructions: command.instructions,
      starDateTime: command.startDateTime,
      endDateTime: command.endDateTime,
    };
    return this.read(
      this.http.post<ClinicalConsultationResponse>(
        this.url(command.consultationId, 'treatments'),
        body,
      ),
      { conflict: ClinicalAttentionErrorCode.TreatmentConflict },
    );
  }

  complete(consultationId: number): Promise<ClinicalConsultation> {
    return this.transition(consultationId, 'complete', {
      conflict: ClinicalAttentionErrorCode.IncompleteConsultation,
    });
  }

  cancel(command: CancelClinicalConsultationCommand): Promise<ClinicalConsultation> {
    const url = this.url(command.consultationId, 'cancel');
    return this.read(this.http.put<ClinicalConsultationResponse>(url, { reason: command.reason }));
  }

  private url(consultationId: number, path?: string): string {
    return path
      ? `${this.consultationsUrl}/${consultationId}/${path}`
      : `${this.consultationsUrl}/${consultationId}`;
  }

  private transition(
    consultationId: number,
    action: string,
    context?: ErrorContext,
  ): Promise<ClinicalConsultation> {
    return this.read(
      this.http.put<ClinicalConsultationResponse>(this.url(consultationId, action), null),
      context,
    );
  }

  private async read(
    request: Observable<ClinicalConsultationResponse>,
    context?: ErrorContext,
  ): Promise<ClinicalConsultation> {
    return toClinicalConsultation(await this.send(request, context));
  }

  private async send<T>(request: Observable<T>, context?: ErrorContext): Promise<T> {
    try {
      return await firstValueFrom(request);
    } catch (error) {
      const apiError = error as Partial<ApiError>;
      throw toClinicalAttentionError(apiError.status ?? 0, apiError.details ?? [], context);
    }
  }
}
