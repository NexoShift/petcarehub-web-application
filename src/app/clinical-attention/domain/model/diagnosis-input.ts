import { DiagnosisType } from '../enums/diagnosis-type.enum';
import { CLINICAL_FIELD_LIMITS } from './clinical-field-limits';
import { cleanList, optionalText, requireInEnum, requireText } from './command-validation';

export interface DiagnosisInput {
  description: string;
  type: DiagnosisType | null;
  differentialDiagnoses?: readonly string[] | null;
  rationale?: string | null;
}

/** Data shared by registering a diagnosis and reevaluating one. */
export interface CleanDiagnosisInput {
  description: string;
  type: DiagnosisType;
  differentialDiagnoses: string[];
  rationale: string | null;
}

export function cleanDiagnosisInput(input: DiagnosisInput): CleanDiagnosisInput {
  return {
    description: requireText(input.description, CLINICAL_FIELD_LIMITS.diagnosisDescription),
    type: requireInEnum(input.type, DiagnosisType),
    differentialDiagnoses: cleanList(
      input.differentialDiagnoses,
      CLINICAL_FIELD_LIMITS.maxDifferentialDiagnoses,
      CLINICAL_FIELD_LIMITS.differentialDiagnosis,
    ),
    rationale: optionalText(input.rationale, CLINICAL_FIELD_LIMITS.rationale),
  };
}
