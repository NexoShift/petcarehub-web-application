import { AssistantError } from '../domain/model/assistant-error';
import { ClinicalAssistance } from '../domain/model/clinical-assistance.entity';
import { BackgroundType, ClinicalBackground } from '../domain/model/clinical-background';
import { OwnerExplanation } from '../domain/model/owner-explanation.entity';
import { DraftDecision, SoapDraft } from '../domain/model/soap-draft.entity';
import {
  AvailableBackgroundResponse, ClinicalAssistanceResponse, OwnerExplanationResponse, SoapDraftResponse,
} from './resources/clinical-assistance.response';

const toType = (type: string) =>
  type === BackgroundType.VisionAnalysis ? BackgroundType.VisionAnalysis : BackgroundType.PreviousConsultation;

/** Traduce el JSON del LLM a entidades del dominio y los status HTTP a AssistantError. */
export class AssistantAssembler {
  static toBackground(r: AvailableBackgroundResponse): ClinicalBackground {
    return { type: toType(r.type), referenceId: r.referenceId, date: r.date, title: r.title, summary: r.summary ?? '' };
  }

  static toDraft(r: SoapDraftResponse): SoapDraft {
    const decision = Object.values(DraftDecision).includes(r.decision as DraftDecision)
      ? (r.decision as DraftDecision)
      : DraftDecision.Pending;
    return new SoapDraft(
      r.id, r.subjective ?? '', r.objective ?? '', r.assessment ?? '', r.plan ?? '', r.warnings ?? [],
      r.model ?? '', decision, r.editedText ?? null, r.reportUrl ?? null, new Date(r.createdAt),
    );
  }

  static toAssistance(r: ClinicalAssistanceResponse): ClinicalAssistance {
    return new ClinicalAssistance(
      r.id, r.consultationId, r.petId, r.veterinarianId, r.currentReason, r.status, r.failureReason ?? null,
      (r.backgrounds ?? []).map(b => ({ type: toType(b.type), referenceId: b.referenceId })),
      (r.drafts ?? []).map(d => AssistantAssembler.toDraft(d)),
      new Date(r.createdAt),
    );
  }

  static toExplanation(r: OwnerExplanationResponse): OwnerExplanation {
    return new OwnerExplanation(r.id, r.petId, r.consultationId ?? null, r.question, r.answer, r.model ?? null, new Date(r.createdAt));
  }

  static toError(err: unknown): AssistantError {
    switch ((err as { status?: number })?.status) {
      case 0: return AssistantError.Network;
      case 400: return AssistantError.BadRequest;
      case 403: return AssistantError.Forbidden;
      case 404: return AssistantError.NotFound;
      case 409: return AssistantError.AlreadyConfirmed;
      case 429: return AssistantError.UsageLimit;
      case 502:
      case 503:
      case 504: return AssistantError.Unavailable;
      default: return AssistantError.Unexpected;
    }
  }
}
