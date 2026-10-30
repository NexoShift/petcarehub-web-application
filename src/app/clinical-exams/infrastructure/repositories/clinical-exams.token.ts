import { InjectionToken } from '@angular/core';
import { ClinicalExamsRepository } from '../../domain/repositories/clinical-exams.repository';
import { HttpClinicalExamsRepository } from './http-clinical-exams.repository';

export const CLINICAL_EXAMS_REPOSITORY = new InjectionToken<ClinicalExamsRepository>(
  'CLINICAL_EXAMS_REPOSITORY',
  {
    providedIn: 'root',
    factory: () => new HttpClinicalExamsRepository(),
  },
);
