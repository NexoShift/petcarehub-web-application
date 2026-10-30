import { ExamStatus } from '../enums/exam-status.enum';
import { ExamType } from '../enums/exam-type.enum';
import { ClinicalFile } from './clinical-file.entity';
import { ExamResult } from './exam-result.entity';

export interface ClinicalExamProps {
  id: number;
  consultationId: number;
  petId: number;
  requestedBy: number;
  type: ExamType;
  indication: string | null;
  status: ExamStatus;
  requestedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  cancellationReason: string | null;
  cancelledAt: Date | null;
  result: ExamResult | null;
  files: ClinicalFile[];
}

/** Complementary exam requested during a consultation. Mirrors the backend state machine. */
export class ClinicalExam {
  readonly id: number;
  readonly consultationId: number;
  readonly petId: number;
  readonly requestedBy: number;
  readonly type: ExamType;
  readonly indication: string | null;
  readonly status: ExamStatus;
  readonly requestedAt: Date;
  readonly startedAt: Date | null;
  readonly completedAt: Date | null;
  readonly cancellationReason: string | null;
  readonly cancelledAt: Date | null;
  readonly result: ExamResult | null;
  readonly files: ClinicalFile[];

  constructor(props: ClinicalExamProps) {
    this.id = props.id;
    this.consultationId = props.consultationId;
    this.petId = props.petId;
    this.requestedBy = props.requestedBy;
    this.type = props.type;
    this.indication = props.indication;
    this.status = props.status;
    this.requestedAt = props.requestedAt;
    this.startedAt = props.startedAt;
    this.completedAt = props.completedAt;
    this.cancellationReason = props.cancellationReason;
    this.cancelledAt = props.cancelledAt;
    this.result = props.result;
    this.files = props.files;
  }

  get canStart(): boolean {
    return this.status === ExamStatus.Requested;
  }

  get canCancel(): boolean {
    return this.status === ExamStatus.Requested || this.status === ExamStatus.InProcess;
  }

  get canRegisterResult(): boolean {
    return this.status === ExamStatus.InProcess && this.result === null;
  }

  get canValidateResult(): boolean {
    return this.status === ExamStatus.InProcess && this.result !== null && !this.result.validated;
  }

  get canComplete(): boolean {
    return this.status === ExamStatus.InProcess && this.result?.validated === true;
  }

  get canAttachFiles(): boolean {
    return this.status === ExamStatus.InProcess || this.status === ExamStatus.Completed;
  }

  withFile(file: ClinicalFile): ClinicalExam {
    return new ClinicalExam({ ...this, files: [...this.files, file] });
  }
}
