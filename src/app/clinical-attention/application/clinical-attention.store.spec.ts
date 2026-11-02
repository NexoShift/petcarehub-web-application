import { TestBed } from '@angular/core/testing';
import { ConsultationStatus } from '../domain/enums/consultation-status.enum';
import { CancelClinicalConsultationCommand } from '../domain/model/cancel-clinical-consultation.command';
import {
  ClinicalAttentionError,
  ClinicalAttentionErrorCode,
} from '../domain/model/clinical-attention-error';
import { CreateClinicalConsultationCommand } from '../domain/model/create-clinical-consultation.command';
import { RegisterAnamnesisCommand } from '../domain/model/register-anamnesis.command';
import { ClinicalAttentionRepository } from '../domain/repositories/clinical-attention.repository';
import { CLINICAL_ATTENTION_REPOSITORY } from '../infrastructure/repositories/clinical-attention.token';
import { anamnesis, consultation } from '../testing/clinical-attention.fixtures';
import { ClinicalAttentionStore } from './clinical-attention.store';

describe('ClinicalAttentionStore', () => {
  let repository: { [K in keyof ClinicalAttentionRepository]: ReturnType<typeof vi.fn> };
  let store: ClinicalAttentionStore;

  beforeEach(() => {
    repository = {
      findByPetId: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      start: vi.fn(),
      registerAnamnesis: vi.fn(),
      registerPhysiologicalAssessment: vi.fn(),
      addClinicalFinding: vi.fn(),
      registerDiagnosis: vi.fn(),
      reevaluateDiagnosis: vi.fn(),
      complete: vi.fn(),
      cancel: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: CLINICAL_ATTENTION_REPOSITORY, useValue: repository }],
    });
    store = TestBed.inject(ClinicalAttentionStore);
  });

  it('loads the consultations of a pet', async () => {
    repository.findByPetId.mockResolvedValue([consultation({ id: 1 }), consultation({ id: 2 })]);

    const loaded = await store.loadByPet(20);

    expect(loaded).toBe(true);
    expect(store.petConsultations().map((current) => current.id)).toEqual([1, 2]);
  });

  it('keeps the created consultation as the open one', async () => {
    repository.create.mockResolvedValue(
      consultation({ id: 7, status: ConsultationStatus.Created }),
    );

    const saved = await store.create(new CreateClinicalConsultationCommand(20, 3, null, 'Control'));

    expect(saved).toBe(true);
    expect(store.consultation()?.id).toBe(7);
  });

  it('replaces the open consultation and its entry in the list after a change', async () => {
    repository.findByPetId.mockResolvedValue([consultation({ id: 10 }), consultation({ id: 11 })]);
    repository.registerAnamnesis.mockResolvedValue(
      consultation({ id: 10, anamnesis: anamnesis() }),
    );
    await store.loadByPet(20);

    await store.registerAnamnesis(
      new RegisterAnamnesisCommand(10, { chiefComplaint: 'Vomita', evolutionTime: '1 día' }),
    );

    expect(store.consultation()?.anamnesis).not.toBeNull();
    expect(store.petConsultations()[0].anamnesis).not.toBeNull();
    expect(store.petConsultations()[1].anamnesis).toBeNull();
  });

  it('clears the open consultation while another one loads', async () => {
    repository.findById.mockResolvedValueOnce(consultation({ id: 1 }));
    await store.load(1);
    let resolve: (value: ReturnType<typeof consultation>) => void = () => undefined;
    repository.findById.mockReturnValueOnce(new Promise((done) => (resolve = done)));

    const loading = store.load(2);

    expect(store.consultation()).toBeNull();
    expect(store.isLoading()).toBe(true);
    resolve(consultation({ id: 2 }));
    await loading;
    expect(store.consultation()?.id).toBe(2);
  });

  it('exposes the error code when the api rejects the request', async () => {
    repository.create.mockRejectedValue(
      new ClinicalAttentionError(ClinicalAttentionErrorCode.PetNotFound),
    );

    const saved = await store.create(new CreateClinicalConsultationCommand(99, 3, null, 'Control'));

    expect(saved).toBe(false);
    expect(store.error()).toBe(ClinicalAttentionErrorCode.PetNotFound);
  });

  it('exposes the pending items of an incomplete consultation', async () => {
    repository.complete.mockRejectedValue(
      new ClinicalAttentionError(ClinicalAttentionErrorCode.IncompleteConsultation, [
        'anamnesis',
        'primaryDiagnosis',
      ]),
    );

    await store.complete(10);

    expect(store.error()).toBe(ClinicalAttentionErrorCode.IncompleteConsultation);
    expect(store.pendingItems()).toEqual(['anamnesis', 'primaryDiagnosis']);
  });

  it('forgets the previous error and pending items on the next request', async () => {
    repository.complete.mockRejectedValueOnce(
      new ClinicalAttentionError(ClinicalAttentionErrorCode.IncompleteConsultation, ['anamnesis']),
    );
    await store.complete(10);
    repository.cancel.mockResolvedValue(consultation({ status: ConsultationStatus.Cancelled }));

    await store.cancel(new CancelClinicalConsultationCommand(10, 'El tutor se fue'));

    expect(store.error()).toBeNull();
    expect(store.pendingItems()).toEqual([]);
  });

  it('turns an unknown failure into an unexpected error', async () => {
    repository.start.mockRejectedValue(new Error('boom'));

    await store.start(10);

    expect(store.error()).toBe(ClinicalAttentionErrorCode.Unexpected);
  });

  it('reports an invalid command before any request is sent', () => {
    store.reportError(new ClinicalAttentionError(ClinicalAttentionErrorCode.InvalidVitalSigns));

    expect(store.error()).toBe(ClinicalAttentionErrorCode.InvalidVitalSigns);
    expect(repository.registerPhysiologicalAssessment).not.toHaveBeenCalled();
  });

  it('loads the pet history without touching the loading state or the error', async () => {
    repository.findByPetId.mockResolvedValue([consultation({ id: 1 })]);

    await store.loadPetHistory(20);

    expect(store.petHistory().map((current) => current.id)).toEqual([1]);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('ignores a failure while loading the pet history', async () => {
    repository.findByPetId.mockRejectedValue(
      new ClinicalAttentionError(ClinicalAttentionErrorCode.NotAllowed),
    );

    await store.loadPetHistory(20);

    expect(store.petHistory()).toEqual([]);
    expect(store.error()).toBeNull();
  });
});
