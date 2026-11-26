import { TreatmentStatus } from '../enums/treatment-status.enum';
import { ClinicalAttentionError, ClinicalAttentionErrorCode } from './clinical-attention-error';
import { RegisterPrescriptionCommand } from './register-prescription.command';
import { RegisterTreatmentCommand } from './register-treatment.command';
import { Treatment } from './treatment.entity';

const codeOf = (fn: () => unknown) => {
  try { fn(); return null; } catch (e) { return (e as ClinicalAttentionError).code; }
};

describe('Tratamiento y receta: dominio', () => {
  it('el tratamiento recorta textos y acepta fin vacío', () => {
    const c = new RegisterTreatmentCommand(4, { description: ' Antibiótico ', instruction: ' Con comida ', startDate: '2026-11-25', endDate: '' });
    expect(c).toMatchObject({ description: 'Antibiótico', instruction: 'Con comida', startDate: '2026-11-25', endDate: null });
  });

  it('rechaza fin antes del inicio y fechas mal formadas', () => {
    expect(codeOf(() => new RegisterTreatmentCommand(4, { description: 'a', instruction: 'b', startDate: '2026-11-25', endDate: '2026-11-20' })))
      .toBe(ClinicalAttentionErrorCode.InvalidTreatmentDates);
    expect(codeOf(() => new RegisterTreatmentCommand(4, { description: 'a', instruction: 'b', startDate: '25/11/2026' })))
      .toBe(ClinicalAttentionErrorCode.InvalidTreatmentDates);
    expect(codeOf(() => new RegisterTreatmentCommand(4, { description: '', instruction: 'b', startDate: '2026-11-25' })))
      .toBe(ClinicalAttentionErrorCode.InvalidRequest);
  });

  it('la receta ignora filas vacías y exige de 1 a 15 medicamentos', () => {
    const med = { name: 'Amoxicilina', dosage: '250 mg', frequency: 'cada 12 h', duration: '7 días' };
    const c = new RegisterPrescriptionCommand(4, { generalInstruction: ' ', medications: [med, { name: '', dosage: '', frequency: '', duration: '' }] });
    expect(c.medications).toEqual([{ ...med, indication: null }]);
    expect(c.generalInstruction).toBeNull();
    expect(codeOf(() => new RegisterPrescriptionCommand(4, { medications: [] }))).toBe(ClinicalAttentionErrorCode.InvalidPrescription);
    expect(codeOf(() => new RegisterPrescriptionCommand(4, { medications: Array(16).fill(med) }))).toBe(ClinicalAttentionErrorCode.InvalidPrescription);
    expect(codeOf(() => new RegisterPrescriptionCommand(4, { medications: [{ ...med, dosage: '' }] }))).toBe(ClinicalAttentionErrorCode.InvalidRequest);
  });

  it('un tratamiento está vigente si está activo y hoy cae dentro de sus fechas', () => {
    const t = (start: string, end: string | null, status = TreatmentStatus.Active) =>
      new Treatment(1, 'x', 'y', start, end, status, 1, new Date());
    expect(t('2026-11-20', '2026-11-30').isCurrentOn('2026-11-25')).toBe(true);
    expect(t('2026-11-20', null).isCurrentOn('2026-11-25')).toBe(true);
    expect(t('2026-11-20', '2026-11-24').isCurrentOn('2026-11-25')).toBe(false);
    expect(t('2026-11-20', null, TreatmentStatus.Suspended).isCurrentOn('2026-11-25')).toBe(false);
  });
});
