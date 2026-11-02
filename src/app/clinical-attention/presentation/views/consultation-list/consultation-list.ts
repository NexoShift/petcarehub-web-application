import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ClinicalAttentionStore } from '../../../application/clinical-attention.store';
import { ConsultationStatusChip } from '../../components/consultation-status-chip/consultation-status-chip';

/**
 * Consultations of a pet (MW-22). The API lists consultations by pet, so the veterinarian
 * looks the patient up by its number until the Profiles context offers a patient directory.
 */
@Component({
  selector: 'app-consultation-list',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTableModule,
    TranslatePipe,
    ConsultationStatusChip,
  ],
  templateUrl: './consultation-list.html',
  styleUrl: '../../clinical-attention.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsultationList implements OnInit {
  /** Bound from the `petId` query parameter so the list can be linked. */
  readonly petId = input<string>();

  protected readonly store = inject(ClinicalAttentionStore);
  protected readonly columns = ['id', 'createdAt', 'reason', 'status', 'actions'];
  protected readonly shownPetId = signal<number | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    petId: [null as number | null, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.store.clearError();
    const petId = Number(this.petId());
    if (Number.isInteger(petId) && petId > 0) {
      this.form.controls.petId.setValue(petId);
      void this.search();
    }
  }

  protected async search(): Promise<void> {
    const control = this.form.controls.petId;
    if (control.invalid || control.value === null) {
      control.markAsTouched();
      return;
    }
    if (await this.store.loadByPet(control.value)) {
      this.shownPetId.set(control.value);
    }
  }
}
