import { AssistantError } from './assistant-error';
import { MAX_QUESTION_LENGTH } from './owner-explanation.entity';

/** Pregunta del dueño. create() valida antes de gastar una llamada al LLM. */
export class AskOwnerExplanationCommand {
  private constructor(
    readonly petId: number,
    readonly consultationId: number | null,
    readonly question: string,
  ) {}

  static create(params: { petId: number | null; consultationId?: number | null; question: string }): AskOwnerExplanationCommand {
    const question = params.question.trim();
    if (!params.petId || params.petId <= 0) throw AssistantError.BadRequest;
    if (!question) throw AssistantError.EmptyQuestion;
    if (question.length > MAX_QUESTION_LENGTH) throw AssistantError.QuestionTooLong;
    return new AskOwnerExplanationCommand(params.petId, params.consultationId ?? null, question);
  }
}
