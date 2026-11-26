import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CLINICAL_ASSISTANT_PROVIDERS } from '../../../llm.providers';
import { VetClinicalAssistant } from '../../views/vet-clinical-assistant/vet-clinical-assistant';

/**
 * Fase 4 de la consulta: el Asistente clínico (LLM) ya fijado en este paciente y esta consulta.
 * Lo usa Clinical Attention desde la API pública del contexto (index.ts).
 */
@Component({
  selector: 'app-consultation-assistant',
  imports: [VetClinicalAssistant],
  providers: CLINICAL_ASSISTANT_PROVIDERS,
  template: `<app-vet-clinical-assistant [petId]="pet()" [consultationId]="consultation()" [embedded]="true" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsultationAssistant {
  readonly petId = input.required<number>();
  readonly consultationId = input.required<number>();

  protected readonly pet = computed(() => String(this.petId()));
  protected readonly consultation = computed(() => String(this.consultationId()));
}
