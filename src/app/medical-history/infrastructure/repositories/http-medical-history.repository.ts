import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiError } from '../../../shared/domain/api-error';
import { MedicalHistory } from '../../domain/model/medical-history.entity';
import { MedicalHistoryErrorCode } from '../../domain/model/medical-history-error';
import { RecordAllergyCommand } from '../../domain/model/record-allergy.command';
import { RecordVaccinationCommand } from '../../domain/model/record-vaccination.command';
import { MedicalHistoryRepository } from '../../domain/repositories/medical-history.repository';
import { toMedicalHistory, toMedicalHistoryError } from '../acl/medical-history-assemblers';
import { MedicalHistoryResponse } from '../acl/medical-history-responses';

export class HttpMedicalHistoryRepository implements MedicalHistoryRepository {
  private readonly http = inject(HttpClient);

  private url(petId: number): string {
    return `${environment.apiBaseUrl}/pets/${petId}/medical-history`;
  }

  async findByPetId(petId: number): Promise<MedicalHistory> {
    return toMedicalHistory(await this.send(this.http.get<MedicalHistoryResponse>(this.url(petId))));
  }

  async recordAllergy(command: RecordAllergyCommand): Promise<MedicalHistory> {
    const body = {
      allergen: command.allergen,
      reaction: command.reaction,
      severity: command.severity,
      notes: command.notes,
    };
    const response = await this.send(
      this.http.post<MedicalHistoryResponse>(`${this.url(command.petId)}/allergies`, body),
      MedicalHistoryErrorCode.InvalidAllergy,
    );
    return toMedicalHistory(response);
  }

  async recordVaccination(command: RecordVaccinationCommand): Promise<MedicalHistory> {
    const body = {
      vaccineName: command.vaccineName,
      appliedOn: command.appliedOn,
      doseNumber: command.doseNumber,
      nextDoseOn: command.nextDoseOn,
      batchNumber: command.batchNumber,
      notes: command.notes,
    };
    const response = await this.send(
      this.http.post<MedicalHistoryResponse>(`${this.url(command.petId)}/vaccinations`, body),
      MedicalHistoryErrorCode.InvalidVaccination,
    );
    return toMedicalHistory(response);
  }

  private async send<T>(request: Observable<T>, badRequestCode?: MedicalHistoryErrorCode): Promise<T> {
    try {
      return await firstValueFrom(request);
    } catch (error) {
      throw toMedicalHistoryError((error as ApiError).status ?? 0, badRequestCode);
    }
  }
}
