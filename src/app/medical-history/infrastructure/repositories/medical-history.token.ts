import { InjectionToken } from '@angular/core';
import { MedicalHistoryRepository } from '../../domain/repositories/medical-history.repository';
import { HttpMedicalHistoryRepository } from './http-medical-history.repository';

export const MEDICAL_HISTORY_REPOSITORY = new InjectionToken<MedicalHistoryRepository>(
  'MEDICAL_HISTORY_REPOSITORY',
  {
    providedIn: 'root',
    factory: () => new HttpMedicalHistoryRepository(),
  },
);
