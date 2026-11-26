import { AssistantError } from './assistant-error';
import { BackgroundType, MAX_BACKGROUNDS } from './clinical-background';

export const MAX_REASON_LENGTH = 1000;

/** Pedido de borrador. create() valida lo mismo que el backend antes de llamarlo. */
export class RequestClinicalAssistanceCommand {
  private constructor(
    readonly consultationId: number,
    readonly petId: number,
    readonly currentReason: string,
    readonly backgrounds: { type: BackgroundType; referenceId: number }[],
  ) {}

  static create(params: {
    consultationId: number | null;
    petId: number | null;
    currentReason: string;
    backgrounds: { type: BackgroundType; referenceId: number }[];
  }): RequestClinicalAssistanceCommand {
    const reason = params.currentReason.trim();
    if (!params.consultationId || params.consultationId <= 0 || !params.petId || params.petId <= 0) {
      throw AssistantError.MissingConsultation;
    }
    if (!reason) throw AssistantError.MissingReason;
    if (reason.length > MAX_REASON_LENGTH) throw AssistantError.ReasonTooLong;
    if (params.backgrounds.length > MAX_BACKGROUNDS) throw AssistantError.TooManyBackgrounds;
    return new RequestClinicalAssistanceCommand(params.consultationId, params.petId, reason, params.backgrounds);
  }
}
