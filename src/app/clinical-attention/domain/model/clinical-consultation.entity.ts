import { ConsultationStatus } from '../enums/consultation-status.enum';
import { Anamnesis } from './anamnesis.entity';
import { ClinicalFinding } from './clinical-finding.entity';
import { Diagnosis } from './diagnosis.entity';
import { PhysiologicalAssessment } from './physiological-assessment.entity';
import { Treatment } from './treatment.entity';

/** Data the backend still needs before a consultation can be completed. */
export type PendingItem = 'anamnesis' | 'physiologicalAssessment' | 'primaryDiagnosis';

export interface ClinicalConsultationProps {
  id: number;
  petId: number;
  veterinarianId: number;
  clinicId: number;
  consultingRoomId: number | null;
  reason: string;
  status: ConsultationStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  cancellationReason: string | null;
  cancelledAt: Date | null;
  anamnesis: Anamnesis | null;
  physiologicalAssessments: readonly PhysiologicalAssessment[];
  findings: readonly ClinicalFinding[];
  diagnoses: readonly Diagnosis[];
  treatment: readonly Treatment[];
  createdAt: Date;
  updatedAt: Date;
}

/** Clinical record of one visit. Mirrors the ClinicalConsultation aggregate of the backend. */
export class ClinicalConsultation {
  readonly id: number;
  readonly petId: number;
  readonly veterinarianId: number;
  readonly clinicId: number;
  readonly consultingRoomId: number | null;
  readonly reason: string;
  readonly status: ConsultationStatus;
  readonly startedAt: Date | null;
  readonly completedAt: Date | null;
  readonly cancellationReason: string | null;
  readonly cancelledAt: Date | null;
  readonly anamnesis: Anamnesis | null;
  readonly physiologicalAssessments: readonly PhysiologicalAssessment[];
  readonly findings: readonly ClinicalFinding[];
  readonly diagnoses: readonly Diagnosis[];
  readonly treatment: readonly Treatment[];
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: ClinicalConsultationProps) {
    this.id = props.id;
    this.petId = props.petId;
    this.veterinarianId = props.veterinarianId;
    this.clinicId = props.clinicId;
    this.consultingRoomId = props.consultingRoomId;
    this.reason = props.reason;
    this.status = props.status;
    this.startedAt = props.startedAt;
    this.completedAt = props.completedAt;
    this.cancellationReason = props.cancellationReason;
    this.cancelledAt = props.cancelledAt;
    this.anamnesis = props.anamnesis;
    this.physiologicalAssessments = props.physiologicalAssessments;
    this.findings = props.findings;
    this.diagnoses = props.diagnoses;
    this.treatment = props.treatment;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  get canStart(): boolean {
    return this.status === ConsultationStatus.Created;
  }

  /** Clinical data can only be registered while the consultation is in progress. */
  get isInProgress(): boolean {
    return this.status === ConsultationStatus.InProgress;
  }

  get canCancel(): boolean {
    return this.status === ConsultationStatus.Created || this.isInProgress;
  }

  /** A completed or cancelled consultation is a closed clinical record: it is read-only. */
  get isClosed(): boolean {
    return (
      this.status === ConsultationStatus.Completed || this.status === ConsultationStatus.Cancelled
    );
  }

  get canRegisterAnamnesis(): boolean {
    return this.isInProgress && this.anamnesis === null;
  }

  get latestAssessment(): PhysiologicalAssessment | null {
    return this.physiologicalAssessments.at(-1) ?? null;
  }

  get currentDiagnoses(): readonly Diagnosis[] {
    return this.diagnoses.filter((diagnosis) => diagnosis.isCurrent);
  }

  get primaryDiagnosis(): Diagnosis | null {
    return this.currentDiagnoses.find((diagnosis) => diagnosis.primary) ?? null;
  }

  /** Only one current primary diagnosis is allowed. */
  get canRegisterPrimaryDiagnosis(): boolean {
    return this.isInProgress && this.primaryDiagnosis === null;
  }

  get statusTreatment(): readonly Treatment[] {
    return this.treatment.filter((treatment) => treatment.isCurrent);
  }

  get pendingItems(): PendingItem[] {
    const pending: PendingItem[] = [];
    if (this.anamnesis === null) pending.push('anamnesis');
    if (this.physiologicalAssessments.length === 0) pending.push('physiologicalAssessment');
    if (this.primaryDiagnosis === null) pending.push('primaryDiagnosis');
    return pending;
  }

  get canComplete(): boolean {
    return this.isInProgress && this.pendingItems.length === 0;
  }
}
