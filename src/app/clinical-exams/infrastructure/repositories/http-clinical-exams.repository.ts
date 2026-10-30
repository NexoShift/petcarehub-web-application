import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiError } from '../../../shared/domain/api-error';
import { CancelClinicalExamCommand } from '../../domain/model/cancel-clinical-exam.command';
import { ClinicalExam } from '../../domain/model/clinical-exam.entity';
import { ClinicalExamsErrorCode } from '../../domain/model/clinical-exams-error';
import { ClinicalFile } from '../../domain/model/clinical-file.entity';
import { RegisterExamResultCommand } from '../../domain/model/register-exam-result.command';
import { RequestClinicalExamCommand } from '../../domain/model/request-clinical-exam.command';
import { UploadClinicalFileCommand } from '../../domain/model/upload-clinical-file.command';
import { ClinicalExamsRepository } from '../../domain/repositories/clinical-exams.repository';
import {
  toClinicalExam,
  toClinicalExamsError,
  toClinicalFile,
} from '../acl/clinical-exams-assemblers';
import { ClinicalExamResponse, ClinicalFileResponse } from '../acl/clinical-exams-responses';

export class HttpClinicalExamsRepository implements ClinicalExamsRepository {
  private readonly http = inject(HttpClient);
  private readonly examsUrl = `${environment.apiBaseUrl}/clinical-exams`;

  async findByConsultationId(consultationId: number): Promise<ClinicalExam[]> {
    const url = `${environment.apiBaseUrl}/clinical-consultations/${consultationId}/clinical-exams`;
    const responses = await this.send(this.http.get<ClinicalExamResponse[]>(url));
    return responses.map(toClinicalExam);
  }

  async findById(examId: number): Promise<ClinicalExam> {
    return toClinicalExam(
      await this.send(this.http.get<ClinicalExamResponse>(`${this.examsUrl}/${examId}`)),
    );
  }

  async request(command: RequestClinicalExamCommand): Promise<ClinicalExam> {
    const body = {
      consultationId: command.consultationId,
      type: command.type,
      indication: command.indication,
    };
    const response = await this.send(
      this.http.post<ClinicalExamResponse>(this.examsUrl, body),
      ClinicalExamsErrorCode.ConsultationNotAvailable,
    );
    return toClinicalExam(response);
  }

  start(examId: number): Promise<ClinicalExam> {
    return this.transition(examId, 'start');
  }

  async cancel(command: CancelClinicalExamCommand): Promise<ClinicalExam> {
    const url = `${this.examsUrl}/${command.examId}/cancel`;
    const body = { reason: command.reason };
    return toClinicalExam(await this.send(this.http.put<ClinicalExamResponse>(url, body)));
  }

  async registerResult(command: RegisterExamResultCommand): Promise<ClinicalExam> {
    const url = `${this.examsUrl}/${command.examId}/result`;
    const body = {
      summary: command.summary,
      values: command.values,
      interpretation: command.interpretation,
      resultDate: command.resultDate,
    };
    return toClinicalExam(await this.send(this.http.post<ClinicalExamResponse>(url, body)));
  }

  validateResult(examId: number): Promise<ClinicalExam> {
    return this.transition(examId, 'result/validate');
  }

  complete(examId: number): Promise<ClinicalExam> {
    return this.transition(examId, 'complete');
  }

  async uploadFile(command: UploadClinicalFileCommand): Promise<ClinicalFile> {
    const formData = new FormData();
    formData.append('file', command.file, command.file.name);
    const url = `${this.examsUrl}/${command.examId}/files`;
    return toClinicalFile(await this.send(this.http.post<ClinicalFileResponse>(url, formData)));
  }

  downloadFile(examId: number, fileId: number): Promise<Blob> {
    const url = `${this.examsUrl}/${examId}/files/${fileId}`;
    return this.send(this.http.get(url, { responseType: 'blob' }));
  }

  private async transition(examId: number, action: string): Promise<ClinicalExam> {
    const url = `${this.examsUrl}/${examId}/${action}`;
    return toClinicalExam(await this.send(this.http.put<ClinicalExamResponse>(url, null)));
  }

  private async send<T>(request: Observable<T>, conflictCode?: ClinicalExamsErrorCode): Promise<T> {
    try {
      return await firstValueFrom(request);
    } catch (error) {
      throw toClinicalExamsError((error as ApiError).status ?? 0, conflictCode);
    }
  }
}
