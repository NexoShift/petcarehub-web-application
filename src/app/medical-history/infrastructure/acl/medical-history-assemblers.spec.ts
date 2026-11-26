import { describe, expect, it } from 'vitest';
import { MedicalHistoryErrorCode } from '../../domain/model/medical-history-error';
import { toMedicalHistory, toMedicalHistoryError } from './medical-history-assemblers';

describe('medical history assemblers', () => {
  it('maps the backend resource', () => {
    const history = toMedicalHistory({
      petId: 22,
      allergies: [{ id: 1, allergen: 'Pollo', reaction: 'Picazón', severity: 'SEVERE', notes: null, reportedBy: 'OWNER', recordedAt: '2026-11-20T10:00:00Z' }],
      vaccinations: [{ id: 2, vaccineName: 'Antirrábica', doseNumber: 1, appliedOn: '2026-11-01', nextDoseOn: '2027-11-01', batchNumber: 'L-1', notes: null, veterinarianId: 3, clinicId: 1 }],
      entries: [{ id: 37, type: 'EXAM_RESULT_VALIDATED', referenceId: 9, consultationId: 46, clinicId: 1, veterinarianId: 3, examType: 'LABORATORY', summary: 'Normal', occurredAt: '2026-11-25T14:33:50Z' }],
    });
    expect(history.petId).toBe(22);
    expect(history.allergies[0].isSevere).toBe(true);
    expect(history.allergies[0].isOwnerReported).toBe(true);
    expect(history.vaccinations[0].nextDoseOn).toBe('2027-11-01');
    expect(history.entries[0].isExamResult).toBe(true);
    expect(history.entries[0].occurredAt.toISOString()).toBe('2026-11-25T14:33:50.000Z');
  });

  it('accepts null lists', () => {
    const history = toMedicalHistory({ petId: 1, allergies: null, vaccinations: null, entries: null });
    expect([history.allergies, history.vaccinations, history.entries]).toEqual([[], [], []]);
  });

  it('maps HTTP status to error codes', () => {
    expect(toMedicalHistoryError(400, MedicalHistoryErrorCode.InvalidAllergy).code).toBe(MedicalHistoryErrorCode.InvalidAllergy);
    expect(toMedicalHistoryError(403).code).toBe(MedicalHistoryErrorCode.NotAllowed);
    expect(toMedicalHistoryError(404).code).toBe(MedicalHistoryErrorCode.PetNotFound);
    expect(toMedicalHistoryError(500).code).toBe(MedicalHistoryErrorCode.Unexpected);
  });
});
