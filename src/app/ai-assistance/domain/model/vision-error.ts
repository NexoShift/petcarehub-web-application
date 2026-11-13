/**
 * Errores del contexto como claves de i18n (public/i18n/*.json → aiVision.errors.*).
 * La infraestructura traduce el status HTTP a uno de estos; la vista hace | translate.
 */
export enum VisionError {
  InvalidFile = 'aiVision.errors.invalidFile',
  TooLarge = 'aiVision.errors.tooLarge',
  TooSmall = 'aiVision.errors.tooSmall',
  NotEvaluable = 'aiVision.errors.notEvaluable',
  MissingData = 'aiVision.errors.missingData',
  Forbidden = 'aiVision.errors.forbidden',
  NotFound = 'aiVision.errors.notFound',
  UsageLimit = 'aiVision.errors.usageLimit',
  Unavailable = 'aiVision.errors.unavailable',
  Network = 'aiVision.errors.network',
  Unexpected = 'aiVision.errors.unexpected',
}
