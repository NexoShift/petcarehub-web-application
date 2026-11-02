import { DiagnosisType } from '../enums/diagnosis-type.enum';
import { requireId } from './command-validation';
import { cleanDiagnosisInput, DiagnosisInput } from './diagnosis-input';

/** Replaces a current diagnosis with a new one. The previous one stays as SUPERSEDED (CON-01). */
export class ReevaluateDiagnosisCommand {
  readonly description: string;
  readonly type: DiagnosisType;
  readonly differentialDiagnoses: string[];
  readonly rationale: string | null;

  constructor(
    readonly consultationId: number,
    readonly diagnosisId: number,
    input: DiagnosisInput,
  ) {
    requireId(consultationId);
    requireId(diagnosisId);
    const clean = cleanDiagnosisInput(input);
    this.description = clean.description;
    this.type = clean.type;
    this.differentialDiagnoses = clean.differentialDiagnoses;
    this.rationale = clean.rationale;
  }
}
