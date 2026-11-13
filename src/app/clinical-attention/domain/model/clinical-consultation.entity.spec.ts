import { ConsultationStatus } from '../enums/consultation-status.enum';
import { DiagnosisStatus } from '../enums/diagnosis-status.enum';
import {
  anamnesis,
  assessment,
  completableConsultation,
  consultation,
  diagnosis,
  treatment,
} from '../../testing/clinical-attention.fixtures';
import { TreatmentStatus } from '../enums/treatment-status.enum';

describe('ClinicalConsultation', () => {
  it('can only be started while it is created', () => {
    expect(consultation({ status: ConsultationStatus.Created }).canStart).toBe(true);
    expect(consultation({ status: ConsultationStatus.InProgress }).canStart).toBe(false);
  });

  it('can be cancelled until it is completed', () => {
    expect(consultation({ status: ConsultationStatus.Created }).canCancel).toBe(true);
    expect(consultation({ status: ConsultationStatus.InProgress }).canCancel).toBe(true);
    expect(consultation({ status: ConsultationStatus.Completed }).canCancel).toBe(false);
    expect(consultation({ status: ConsultationStatus.Cancelled }).canCancel).toBe(false);
  });

  it('is a closed record once it is completed or cancelled', () => {
    expect(consultation({ status: ConsultationStatus.Completed }).isClosed).toBe(true);
    expect(consultation({ status: ConsultationStatus.Cancelled }).isClosed).toBe(true);
    expect(consultation({ status: ConsultationStatus.InProgress }).isClosed).toBe(false);
  });

  it('accepts the anamnesis only once and only while in progress', () => {
    expect(consultation().canRegisterAnamnesis).toBe(true);
    expect(consultation({ anamnesis: anamnesis() }).canRegisterAnamnesis).toBe(false);
    expect(consultation({ status: ConsultationStatus.Created }).canRegisterAnamnesis).toBe(false);
  });

  it('lists what is missing to complete it', () => {
    expect(consultation().pendingItems).toEqual([
      'anamnesis',
      'physiologicalAssessment',
      'primaryDiagnosis',
    ]);
    expect(consultation({ anamnesis: anamnesis() }).pendingItems).toEqual([
      'physiologicalAssessment',
      'primaryDiagnosis',
    ]);
    expect(completableConsultation().pendingItems).toEqual([]);
  });

  it('can be completed only when nothing is pending and it is in progress', () => {
    expect(completableConsultation().canComplete).toBe(true);
    expect(consultation().canComplete).toBe(false);
    expect(
      consultation({ ...completableConsultation(), status: ConsultationStatus.Created })
        .canComplete,
    ).toBe(false);
  });

  it('ignores a superseded primary diagnosis', () => {
    const replaced = diagnosis({ id: 1, status: DiagnosisStatus.Superseded });
    const current = diagnosis({ id: 2, previousDiagnosisId: 1 });

    const reevaluated = consultation({ diagnoses: [replaced, current] });

    expect(reevaluated.primaryDiagnosis?.id).toBe(2);
    expect(reevaluated.currentDiagnoses.map((item) => item.id)).toEqual([2]);
    expect(reevaluated.canRegisterPrimaryDiagnosis).toBe(false);
  });

  it('offers a primary diagnosis again when only superseded ones remain', () => {
    const replaced = diagnosis({ status: DiagnosisStatus.Superseded });

    expect(consultation({ diagnoses: [replaced] }).canRegisterPrimaryDiagnosis).toBe(true);
  });

  it('filters only current (active) treatments among active, completed, and suspended', () => {
    const active = treatment({ id: 1, treatmentStatus: TreatmentStatus.Active });
    const completed = treatment({ id: 2, treatmentStatus: TreatmentStatus.Completed });
    const suspended = treatment({ id: 3, treatmentStatus: TreatmentStatus.Suspended });

    const record = consultation({
      treatment: [active, completed, suspended],
    });

    expect(record.statusTreatment.map((item) => item.id)).toEqual([1]);
    expect(record.statusTreatment[0].isCurrent).toBe(true);
  });

  it('exposes the latest assessment', () => {
    const latest = consultation({ physiologicalAssessments: [assessment(1), assessment(2)] });

    expect(latest.latestAssessment?.id).toBe(2);
    expect(consultation().latestAssessment).toBeNull();
  });
});
