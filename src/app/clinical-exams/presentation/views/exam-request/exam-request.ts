import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import {
  FormGroupDirective,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ClinicalExamsStore } from '../../../application/clinical-exams.store';
import { ExamType } from '../../../domain/enums/exam-type.enum';
import {
  INDICATION_MAX_LENGTH,
  RequestClinicalExamCommand,
} from '../../../domain/model/request-clinical-exam.command';
import { ExamStatusChip } from '../../components/exam-status-chip/exam-status-chip';

@Component({
  selector: 'app-exam-request',
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
    MatSelectModule,
    MatTableModule,
    TranslatePipe,
    ExamStatusChip,
  ],
  templateUrl: './exam-request.html',
  styleUrl: '../clinical-exams.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamRequest implements OnInit {
  readonly consultationId = input<string>();

  protected readonly store = inject(ClinicalExamsStore);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  protected readonly examTypes = Object.values(ExamType);
  protected readonly indicationMaxLength = INDICATION_MAX_LENGTH;
  protected readonly columns = ['id', 'type', 'status', 'requestedAt', 'actions'];
  protected readonly shownConsultationId = signal<number | null>(null);

  private readonly formDirective = viewChild.required(FormGroupDirective);
  protected readonly form = inject(NonNullableFormBuilder).group({
    consultationId: [null as number | null, [Validators.required, Validators.min(1)]],
    type: [null as ExamType | null, Validators.required],
    indication: ['', Validators.maxLength(INDICATION_MAX_LENGTH)],
  });

  ngOnInit(): void {
    this.store.clearError();
    const consultationId = Number(this.consultationId());
    if (Number.isInteger(consultationId) && consultationId > 0) {
      this.form.controls.consultationId.setValue(consultationId);
      void this.loadExams();
    }
  }

  protected async loadExams(): Promise<void> {
    const control = this.form.controls.consultationId;
    if (control.invalid || control.value === null) {
      control.markAsTouched();
      return;
    }
    if (await this.store.loadByConsultation(control.value)) {
      this.shownConsultationId.set(control.value);
    }
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    let command: RequestClinicalExamCommand;
    try {
      command = new RequestClinicalExamCommand(
        value.consultationId!,
        value.type!,
        value.indication,
      );
    } catch (error) {
      this.store.reportError(error);
      return;
    }
    if (this.shownConsultationId() !== command.consultationId) {
      await this.loadExams();
    }
    if (await this.store.request(command)) {
      this.formDirective().resetForm({ consultationId: command.consultationId, indication: '' });
      this.snackBar.open(
        this.translate.instant('clinicalExams.request.requested'),
        this.translate.instant('clinicalExams.close'),
        { duration: 3000 },
      );
    }
  }
}
