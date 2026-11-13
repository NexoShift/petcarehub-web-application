import { cleanTreatmentInput, TreatmentInput } from './treatment-input';
import { requireId } from './command-validation';

export class RegisterTreatmentCommand {
  readonly description: string | null;
  readonly instructions: string | null;
  readonly startDateTime: Date;
  readonly endDateTime: Date;

  constructor(
    readonly consultationId: number,
    input: TreatmentInput) {
    requireId(consultationId);
    const clean = cleanTreatmentInput(input);
    this.description = clean.description;
    this.instructions = clean.instruction;
    this.startDateTime = clean.startDateTime;
    this.endDateTime = clean.endDateTime;
  }
}
