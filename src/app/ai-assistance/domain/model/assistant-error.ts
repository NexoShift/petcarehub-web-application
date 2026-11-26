/** Errores del asistente (LLM) como claves de i18n: aiAssistant.errors.* */
export enum AssistantError {
  MissingConsultation = 'aiAssistant.errors.missingConsultation',
  MissingReason = 'aiAssistant.errors.missingReason',
  ReasonTooLong = 'aiAssistant.errors.reasonTooLong',
  TooManyBackgrounds = 'aiAssistant.errors.tooManyBackgrounds',
  MissingEdit = 'aiAssistant.errors.missingEdit',
  EmptyQuestion = 'aiAssistant.errors.emptyQuestion',
  QuestionTooLong = 'aiAssistant.errors.questionTooLong',
  BadRequest = 'aiAssistant.errors.badRequest',
  Forbidden = 'aiAssistant.errors.forbidden',
  NotFound = 'aiAssistant.errors.notFound',
  AlreadyConfirmed = 'aiAssistant.errors.alreadyConfirmed',
  UsageLimit = 'aiAssistant.errors.usageLimit',
  Unavailable = 'aiAssistant.errors.unavailable',
  Network = 'aiAssistant.errors.network',
  Unexpected = 'aiAssistant.errors.unexpected',
}
