import { ClinicalAttentionError, ClinicalAttentionErrorCode } from './clinical-attention-error';

const fail = (code: ClinicalAttentionErrorCode): never => {
  throw new ClinicalAttentionError(code);
};

export function requireId(value: number | null | undefined): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    return fail(ClinicalAttentionErrorCode.InvalidRequest);
  }
  return value;
}

export function optionalId(value: number | null | undefined): number | null {
  return value === null || value === undefined ? null : requireId(value);
}

export function requireText(value: string | null | undefined, maxLength: number): string {
  const trimmed = value?.trim() ?? '';
  if (trimmed === '' || trimmed.length > maxLength) {
    return fail(ClinicalAttentionErrorCode.InvalidRequest);
  }
  return trimmed;
}

export function optionalText(value: string | null | undefined, maxLength: number): string | null {
  const trimmed = value?.trim() ?? '';
  if (trimmed.length > maxLength) {
    return fail(ClinicalAttentionErrorCode.InvalidRequest);
  }
  return trimmed === '' ? null : trimmed;
}

/** Trims every item, drops blanks and repeated values, and checks the number and size of items. */
export function cleanList(
  values: readonly string[] | null | undefined,
  maxItems: number,
  maxItemLength: number,
): string[] {
  const clean: string[] = [];
  for (const value of values ?? []) {
    const trimmed = value.trim();
    if (trimmed === '' || clean.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
      continue;
    }
    if (trimmed.length > maxItemLength) {
      return fail(ClinicalAttentionErrorCode.InvalidRequest);
    }
    clean.push(trimmed);
  }
  if (clean.length > maxItems) {
    return fail(ClinicalAttentionErrorCode.InvalidRequest);
  }
  return clean;
}

export function requireInEnum<T extends string>(
  value: T | null | undefined,
  allowed: Record<string, T>,
): T {
  if (!value || !Object.values(allowed).includes(value)) {
    return fail(ClinicalAttentionErrorCode.InvalidRequest);
  }
  return value;
}

export function optionalInEnum<T extends string>(
  value: T | null | undefined,
  allowed: Record<string, T>,
): T | null {
  return value === null || value === undefined ? null : requireInEnum(value, allowed);
}

interface NumberRange {
  min?: number;
  max?: number;
  /** When true the value must be strictly greater than zero. */
  positive?: boolean;
  integer?: boolean;
}

/** Checks a vital sign. Anything out of range is reported as InvalidVitalSigns. */
export function requireVitalSign(value: number | null | undefined, range: NumberRange): number {
  const invalid =
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    (range.integer === true && !Number.isInteger(value)) ||
    (range.positive === true && value <= 0) ||
    (range.min !== undefined && value < range.min) ||
    (range.max !== undefined && value > range.max);
  return invalid ? fail(ClinicalAttentionErrorCode.InvalidVitalSigns) : (value as number);
}

export function optionalVitalSign(
  value: number | null | undefined,
  range: NumberRange,
): number | null {
  return value === null || value === undefined ? null : requireVitalSign(value, range);
}
