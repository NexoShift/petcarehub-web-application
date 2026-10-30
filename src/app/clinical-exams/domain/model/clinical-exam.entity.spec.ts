import { ExamStatus } from '../enums/exam-status.enum';
import { ExamType } from '../enums/exam-type.enum';
import { ClinicalExam } from './clinical-exam.entity';
import { ExamResult } from './exam-result.entity';

function exam(status: ExamStatus, result: ExamResult | null = null): ClinicalExam {
  return new ClinicalExam({
    id: 1,
    consultationId: 10,
    petId: 20,
    requestedBy: 30,
    type: ExamType.Laboratory,
    indication: null,
    status,
    requestedAt: new Date(),
    startedAt: null,
    completedAt: null,
    cancellationReason: null,
    cancelledAt: null,
    result,
    files: [],
  });
}

function result(validated: boolean): ExamResult {
  return new ExamResult(5, 'Normal', null, null, '2026-10-28', validated, null, null);
}

describe('ClinicalExam', () => {
  it('allows start and cancel only while requested', () => {
    const requested = exam(ExamStatus.Requested);
    expect(requested.canStart).toBe(true);
    expect(requested.canCancel).toBe(true);
    expect(requested.canRegisterResult).toBe(false);
    expect(requested.canAttachFiles).toBe(false);
  });

  it('allows registering a result and attaching files while in process', () => {
    const inProcess = exam(ExamStatus.InProcess);
    expect(inProcess.canStart).toBe(false);
    expect(inProcess.canRegisterResult).toBe(true);
    expect(inProcess.canAttachFiles).toBe(true);
    expect(inProcess.canComplete).toBe(false);
  });

  it('requires a validated result to complete', () => {
    expect(exam(ExamStatus.InProcess, result(false)).canValidateResult).toBe(true);
    expect(exam(ExamStatus.InProcess, result(false)).canComplete).toBe(false);
    expect(exam(ExamStatus.InProcess, result(true)).canValidateResult).toBe(false);
    expect(exam(ExamStatus.InProcess, result(true)).canComplete).toBe(true);
  });

  it('does not allow changes once completed or cancelled', () => {
    const cancelled = exam(ExamStatus.Cancelled);
    expect(cancelled.canCancel).toBe(false);
    expect(cancelled.canAttachFiles).toBe(false);
    expect(exam(ExamStatus.Completed, result(true)).canCancel).toBe(false);
    expect(exam(ExamStatus.Completed, result(true)).canAttachFiles).toBe(true);
  });
});
