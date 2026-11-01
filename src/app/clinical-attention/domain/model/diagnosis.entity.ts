import { DiagnosisStatus } from '../enums/diagnosis-status.enum';
import { DiagnosisType } from '../enums/diagnosis-type.enum';

export interface DiagnosisProps {
  id: number;
  description: string;
  type: DiagnosisType;
  primary: boolean;
  differentialDiagnoses: readonly string[];
  rationale: string | null;
  status: DiagnosisStatus;
  previousDiagnosisId: number | null;
  diagnosedByVeterinarianId: number;
  diagnosedAt: Date;
}

/** A diagnosis never changes once registered. A reevaluation creates a new one (CON-01). */
export class Diagnosis {
  readonly id: number;
  readonly description: string;
  readonly type: DiagnosisType;
  readonly primary: boolean;
  readonly differentialDiagnoses: readonly string[];
  readonly rationale: string | null;
  readonly status: DiagnosisStatus;
  readonly previousDiagnosisId: number | null;
  readonly diagnosedByVeterinarianId: number;
  readonly diagnosedAt: Date;

  constructor(props: DiagnosisProps) {
    this.id = props.id;
    this.description = props.description;
    this.type = props.type;
    this.primary = props.primary;
    this.differentialDiagnoses = props.differentialDiagnoses;
    this.rationale = props.rationale;
    this.status = props.status;
    this.previousDiagnosisId = props.previousDiagnosisId;
    this.diagnosedByVeterinarianId = props.diagnosedByVeterinarianId;
    this.diagnosedAt = props.diagnosedAt;
  }

  get isCurrent(): boolean {
    return this.status === DiagnosisStatus.Current;
  }
}
