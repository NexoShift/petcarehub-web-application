import { Provider } from '@angular/core';
import { ClinicalAssistantStore } from './application/clinical-assistant.store';
import { OwnerExplainStore } from './application/owner-explain.store';
import { ClinicalAssistanceRepository } from './domain/repositories/clinical-assistance.repository';
import { OwnerExplanationRepository } from './domain/repositories/owner-explanation.repository';
import { HttpClinicalAssistanceRepository } from './infrastructure/http-clinical-assistance.repository';
import { HttpOwnerExplanationRepository } from './infrastructure/http-owner-explanation.repository';

/** Asistente clínico del vet (borrador SOAP): ruta /ai-assistant y fase 4 de la consulta. */
export const CLINICAL_ASSISTANT_PROVIDERS: Provider[] = [
  ClinicalAssistantStore,
  { provide: ClinicalAssistanceRepository, useClass: HttpClinicalAssistanceRepository },
];

/** "Explicar con IA" del dueño: ruta /ai-explain. */
export const OWNER_EXPLAIN_PROVIDERS: Provider[] = [
  OwnerExplainStore,
  { provide: OwnerExplanationRepository, useClass: HttpOwnerExplanationRepository },
];
