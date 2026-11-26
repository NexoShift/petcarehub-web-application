import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AllergySeverity } from '../domain/enums/allergy-severity.enum';
import { MedicalHistory } from '../domain/model/medical-history.entity';
import { MedicalHistoryError, MedicalHistoryErrorCode } from '../domain/model/medical-history-error';
import { RecordAllergyCommand } from '../domain/model/record-allergy.command';
import { MEDICAL_HISTORY_REPOSITORY } from '../infrastructure/repositories/medical-history.token';
import { MedicalHistoryStore } from './medical-history.store';

describe('MedicalHistoryStore', () => {
  const repository = { findByPetId: vi.fn(), recordAllergy: vi.fn(), recordVaccination: vi.fn() };
  let store: MedicalHistoryStore;

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({ providers: [{ provide: MEDICAL_HISTORY_REPOSITORY, useValue: repository }] });
    store = TestBed.inject(MedicalHistoryStore);
  });

  it('loads the history of a pet', async () => {
    repository.findByPetId.mockResolvedValue(new MedicalHistory(4, [], [], []));
    expect(await store.load(4)).toBe(true);
    expect(store.history()?.petId).toBe(4);
    expect(store.isLoading()).toBe(false);
  });

  it('ignores a late answer for a pet that is no longer selected', async () => {
    let resolveFirst!: (h: MedicalHistory) => void;
    repository.findByPetId
      .mockReturnValueOnce(new Promise((r) => (resolveFirst = r)))
      .mockResolvedValueOnce(new MedicalHistory(5, [], [], []));
    const first = store.load(4);
    await store.load(5);
    resolveFirst(new MedicalHistory(4, [], [], []));
    await first;
    expect(store.history()?.petId).toBe(5);
  });

  it('replaces the history with the one returned after recording an allergy', async () => {
    repository.recordAllergy.mockResolvedValue(new MedicalHistory(4, [], [], []));
    const command = new RecordAllergyCommand(4, { allergen: 'Pollo', reaction: '', severity: AllergySeverity.Mild, notes: '' });
    expect(await store.recordAllergy(command)).toBe(true);
    expect(repository.recordAllergy).toHaveBeenCalledWith(command);
    expect(store.history()?.petId).toBe(4);
  });

  it('exposes the error code when the API fails', async () => {
    repository.findByPetId.mockRejectedValue(new MedicalHistoryError(MedicalHistoryErrorCode.NotAllowed));
    expect(await store.load(4)).toBe(false);
    expect(store.error()).toBe(MedicalHistoryErrorCode.NotAllowed);
  });
});
