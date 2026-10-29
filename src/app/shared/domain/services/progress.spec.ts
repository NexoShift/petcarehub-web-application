import { ActiveTreatment } from '../model/dashboard/owner-dashboard';
import { totalDoses, treatmentProgress, usagePercent } from './progress';

describe('progreso del panel', () => {
  const treatment = {
    totalDays: 7,
    dosesTaken: 6,
    medication: { dosesPerDay: 2 },
  } as ActiveTreatment;

  it('calcula las tomas totales', () => {
    expect(totalDoses(treatment)).toBe(14);
  });

  it('6 de 14 tomas es 43 % (42,8 redondeado)', () => {
    expect(treatmentProgress(treatment)).toBe(43);
  });

  it('nunca pasa de 100 %', () => {
    expect(usagePercent({ label: 'x', used: 20, limit: 15, hint: '' })).toBe(100);
  });
});
