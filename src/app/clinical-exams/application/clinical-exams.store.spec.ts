import { TestBed } from '@angular/core/testing';
import { ExamStatus } from '../domain/enums/exam-status.enum';
import { ExamType } from '../domain/enums/exam-type.enum';
import { ClinicalExam } from '../domain/model/clinical-exam.entity';
import { ClinicalExamsError, ClinicalExamsErrorCode } from '../domain/model/clinical-exams-error';
import { RequestClinicalExamCommand } from '../domain/model/request-clinical-exam.command';
import { ClinicalExamsRepository } from '../domain/repositories/clinical-exams.repository';
import { CLINICAL_EXAMS_REPOSITORY } from '../infrastructure/repositories/clinical-exams.token';
import { ClinicalExamsStore } from './clinical-exams.store';

function exam(id: number, status: ExamStatus): ClinicalExam {
  return new ClinicalExam({
    id,
    consultationId: 10,
    petId: 20,
    requestedBy: 30,
    type: ExamType.Ultrasound,
    indication: null,
    status,
    requestedAt: new Date(),
    startedAt: null,
    completedAt: null,
    cancellationReason: null,
    cancelledAt: null,
    result: null,
    files: [],
  });
}

describe('ClinicalExamsStore', () => {
  let repository: { [K in keyof ClinicalExamsRepository]: ReturnType<typeof vi.fn> };
  let store: ClinicalExamsStore;

  beforeEach(() => {
    repository = {
      findByConsultationId: vi.fn(),
      findById: vi.fn(),
      request: vi.fn(),
      start: vi.fn(),
      cancel: vi.fn(),
      registerResult: vi.fn(),
      validateResult: vi.fn(),
      complete: vi.fn(),
      uploadFile: vi.fn(),
      downloadFile: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: CLINICAL_EXAMS_REPOSITORY, useValue: repository }],
    });
    store = TestBed.inject(ClinicalExamsStore);
  });

  it('adds the requested exam to the consultation exams', async () => {
    repository.request.mockResolvedValue(exam(1, ExamStatus.Requested));

    const saved = await store.request(new RequestClinicalExamCommand(10, ExamType.Ultrasound, ''));

    expect(saved).toBe(true);
    expect(store.consultationExams().map((current) => current.id)).toEqual([1]);
  });

  it('replaces the selected exam after a transition', async () => {
    repository.findById.mockResolvedValue(exam(1, ExamStatus.Requested));
    repository.start.mockResolvedValue(exam(1, ExamStatus.InProcess));
    await store.loadExam(1);

    await store.start(1);

    expect(store.selectedExam()?.status).toBe(ExamStatus.InProcess);
  });

  it('exposes the domain error code when the api rejects the request', async () => {
    repository.request.mockRejectedValue(
      new ClinicalExamsError(ClinicalExamsErrorCode.ConsultationNotAvailable),
    );

    const saved = await store.request(new RequestClinicalExamCommand(99, ExamType.Other, null));

    expect(saved).toBe(false);
    expect(store.error()).toBe(ClinicalExamsErrorCode.ConsultationNotAvailable);
  });
});
