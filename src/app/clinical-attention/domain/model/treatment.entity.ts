import { TreatmentStatus } from '../enums/treatment-status.enum';

export interface TreatmentProps {
  id: number;
  description: string;
  instruction: string;
  startDateTime: Date;
  endDateTime: Date;
  treatmentStatus: TreatmentStatus;
}

export class Treatment {
  readonly id: number;
  readonly description: string;
  readonly instruction: string;
  readonly startDateTime: Date;
  readonly endDateTime: Date;
  readonly treatmentStatus: TreatmentStatus;

  constructor(props: TreatmentProps) {
    this.id = props.id;
    this.description = props.description;
    this.instruction = props.instruction;
    this.startDateTime = props.startDateTime;
    this.endDateTime = props.endDateTime;
    this.treatmentStatus = props.treatmentStatus;
  }

  get isCurrent(): boolean {
    return this.treatmentStatus === TreatmentStatus.Active;
  }
}
