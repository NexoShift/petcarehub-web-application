import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, untracked } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../../../shared/presentation/components/icon/icon';
import { ClinicalConsultation } from '../../../domain/model/clinical-consultation.entity';
import { CLINICAL_FIELD_LIMITS } from '../../../domain/model/clinical-field-limits';
import { PrescriptionInput } from '../../../domain/model/register-prescription.command';
import { TreatmentInput } from '../../../domain/model/register-treatment.command';

const today = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Fase "Tratamiento y receta": lo que el vet indica al cerrar la consulta.
 * - Tratamiento: descripción, indicaciones y fechas (la de fin es opcional).
 * - Receta: indicación general y de 1 a 15 medicamentos.
 * Sin la consulta en curso (o para el dueño) solo muestra lo registrado.
 */
@Component({
  selector: 'app-treatment-plan-panel',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    TranslatePipe,
    Icon,
  ],
  templateUrl: './treatment-plan-panel.html',
  styleUrls: ['../../clinical-attention.css', './treatment-plan-panel.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreatmentPlanPanel {
  readonly consultation = input.required<ClinicalConsultation>();
  readonly saving = input(false);
  /** false para el dueño o una consulta cerrada: sin formularios. */
  readonly editable = input(true);
  readonly treatmentSubmitted = output<TreatmentInput>();
  readonly prescriptionSubmitted = output<PrescriptionInput>();

  protected readonly limits = CLINICAL_FIELD_LIMITS;
  protected readonly canEdit = computed(() => this.editable() && this.consultation().canPrescribe);
  protected readonly today = today();

  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly treatmentForm = this.fb.group({
    description: ['', [Validators.required, Validators.maxLength(CLINICAL_FIELD_LIMITS.treatmentDescription)]],
    instruction: ['', [Validators.required, Validators.maxLength(CLINICAL_FIELD_LIMITS.treatmentInstruction)]],
    startDate: [today(), Validators.required],
    endDate: [''],
  });

  protected readonly prescriptionForm = this.fb.group({
    generalInstruction: ['', Validators.maxLength(CLINICAL_FIELD_LIMITS.prescriptionInstruction)],
    medications: this.fb.array([this.medicationRow()]),
  });

  protected get medications(): FormArray {
    return this.prescriptionForm.controls.medications;
  }

  // Solo cambian al guardar; así el reset no corre en cada actualización de la consulta
  private readonly treatmentCount = computed(() => this.consultation().treatments.length);
  private readonly prescriptionCount = computed(() => this.consultation().prescriptions.length);

  constructor() {
    // Se guardó algo: limpia el formulario correspondiente
    effect(() => {
      this.treatmentCount();
      untracked(() => this.treatmentForm.reset({ description: '', instruction: '', startDate: today(), endDate: '' }));
    });
    effect(() => {
      this.prescriptionCount();
      untracked(() => {
        this.prescriptionForm.controls.generalInstruction.reset('');
        this.medications.clear();
        this.medications.push(this.medicationRow());
      });
    });
  }

  protected get endBeforeStart(): boolean {
    const { startDate, endDate } = this.treatmentForm.getRawValue();
    return !!endDate && !!startDate && endDate < startDate;
  }

  protected addMedication(): void {
    if (this.medications.length < CLINICAL_FIELD_LIMITS.maxMedications) {
      this.medications.push(this.medicationRow());
    }
  }

  protected removeMedication(index: number): void {
    if (this.medications.length > 1) this.medications.removeAt(index);
  }

  protected submitTreatment(): void {
    if (this.treatmentForm.invalid || this.endBeforeStart) {
      this.treatmentForm.markAllAsTouched();
      return;
    }
    const value = this.treatmentForm.getRawValue();
    this.treatmentSubmitted.emit({ ...value, endDate: value.endDate || null });
  }

  protected submitPrescription(): void {
    if (this.prescriptionForm.invalid) {
      this.prescriptionForm.markAllAsTouched();
      return;
    }
    this.prescriptionSubmitted.emit(this.prescriptionForm.getRawValue());
  }

  private medicationRow() {
    const l = CLINICAL_FIELD_LIMITS;
    return this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(l.medicationName)]],
      dosage: ['', [Validators.required, Validators.maxLength(l.medicationDosage)]],
      frequency: ['', [Validators.required, Validators.maxLength(l.medicationFrequency)]],
      duration: ['', [Validators.required, Validators.maxLength(l.medicationDuration)]],
      indication: ['', Validators.maxLength(l.medicationIndication)],
    });
  }
}
