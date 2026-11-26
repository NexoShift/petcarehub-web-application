/** Una pregunta del dueño y la respuesta del LLM en lenguaje simple. */
export class OwnerExplanation {
  constructor(
    readonly id: number,
    readonly petId: number,
    readonly consultationId: number | null,
    readonly question: string,
    readonly answer: string,
    readonly model: string | null,
    readonly createdAt: Date,
  ) {}
}

export const MAX_QUESTION_LENGTH = 1000;
