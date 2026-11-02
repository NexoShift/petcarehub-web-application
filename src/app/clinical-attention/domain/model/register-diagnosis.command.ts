import { DiagnosisType } from '../enums/diagnosis-type.enum';
import { requireId } from './command-validation';
import { cleanDiagnosisInput, DiagnosisInput } from './diagnosis-input';

/** A consultation has at most one current primary diagnosis. */
export class RegisterDiagnosisCommand {
  readonly description: string;
  readonly type: DiagnosisType;
  readonly differentialDiagnoses: string[];
  readonly rationale: string | null;

  constructor(
    readonly consultationId: number,
    input: DiagnosisInput,
    readonly primary: boolean,
  ) {
    requireId(consultationId);
    const clean = cleanDiagnosisInput(input);
    this.description = clean.description;
    this.type = clean.type;
    this.differentialDiagnoses = clean.differentialDiagnoses;
    this.rationale = clean.rationale;
  }
}
