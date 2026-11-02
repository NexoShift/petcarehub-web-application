import { InjectionToken } from '@angular/core';
import { ClinicalAttentionRepository } from '../../domain/repositories/clinical-attention.repository';
import { HttpClinicalAttentionRepository } from './http-clinical-attention.repository';

export const CLINICAL_ATTENTION_REPOSITORY = new InjectionToken<ClinicalAttentionRepository>(
  'CLINICAL_ATTENTION_REPOSITORY',
  {
    providedIn: 'root',
    factory: () => new HttpClinicalAttentionRepository(),
  },
);
