import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ClinicalAssistance } from '../domain/model/clinical-assistance.entity';
import { ClinicalBackground } from '../domain/model/clinical-background';
import { RequestClinicalAssistanceCommand } from '../domain/model/request-clinical-assistance.command';
import { DraftDecision } from '../domain/model/soap-draft.entity';
import { ClinicalAssistanceRepository } from '../domain/repositories/clinical-assistance.repository';
import { absoluteApiUrl } from './api-url';
import { AssistantAssembler } from './assistant.assembler';
import { AvailableBackgroundResponse, ClinicalAssistanceResponse } from './resources/clinical-assistance.response';

/** Implementación HTTP contra /ai/clinical-backgrounds y /ai/clinical-assistances (solo ROLE_VETERINARIAN). */
@Injectable()
export class HttpClinicalAssistanceRepository extends ClinicalAssistanceRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/ai/clinical-assistances`;

  findBackgrounds(petId: number): Observable<ClinicalBackground[]> {
    return this.http
      .get<AvailableBackgroundResponse[]>(`${environment.apiBaseUrl}/ai/clinical-backgrounds`, { params: { petId } })
      .pipe(map(list => list.map(AssistantAssembler.toBackground)), this.fail());
  }

  request(command: RequestClinicalAssistanceCommand): Observable<ClinicalAssistance> {
    const body = {
      consultationId: command.consultationId,
      petId: command.petId,
      currentReason: command.currentReason,
      backgrounds: command.backgrounds,
    };
    return this.http.post<ClinicalAssistanceResponse>(this.baseUrl, body).pipe(map(AssistantAssembler.toAssistance), this.fail());
  }

  findByConsultationId(consultationId: number): Observable<ClinicalAssistance | null> {
    // 204 sin cuerpo = la consulta todavía no tiene asistencia
    return this.http
      .get<ClinicalAssistanceResponse | null>(this.baseUrl, { params: { consultationId }, observe: 'response' })
      .pipe(map(res => (res.status === 204 || !res.body ? null : AssistantAssembler.toAssistance(res.body))), this.fail());
  }

  regenerate(assistanceId: number): Observable<ClinicalAssistance> {
    return this.http
      .post<ClinicalAssistanceResponse>(`${this.baseUrl}/${assistanceId}/regenerations`, {})
      .pipe(map(AssistantAssembler.toAssistance), this.fail());
  }

  decide(assistanceId: number, draftId: number, decision: DraftDecision, editedText?: string | null): Observable<ClinicalAssistance> {
    return this.http
      .put<ClinicalAssistanceResponse>(`${this.baseUrl}/${assistanceId}/drafts/${draftId}/decision`, {
        decision,
        editedText: decision === DraftDecision.Edited ? editedText : null,
      })
      .pipe(map(AssistantAssembler.toAssistance), this.fail());
  }

  /** catchError que convierte el error HTTP en AssistantError. */
  private fail<T>() {
    return catchError<T, Observable<never>>(err => throwError(() => AssistantAssembler.toError(err)));
  }

  loadReport(reportUrl: string): Observable<Blob> {
    return this.http.get(absoluteApiUrl(reportUrl), { responseType: 'blob' }).pipe(this.fail());
  }
}
