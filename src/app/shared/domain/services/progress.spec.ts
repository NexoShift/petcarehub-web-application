import { daysBetween, todayIso, treatmentProgress, usagePercent } from './progress';

describe('progreso del panel', () => {
  it('cuenta días de calendario entre dos fechas', () => {
    expect(daysBetween('2026-11-20', '2026-11-26')).toBe(6);
    expect(daysBetween('2026-11-26', '2026-11-26')).toBe(0);
    expect(daysBetween('2026-11-30', '2026-12-02')).toBe(2);
  });

  it('da la fecha local de hoy como yyyy-MM-dd', () => {
    expect(todayIso(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });

  it('día 3 de 7 es 43 % (42,8 redondeado)', () => {
    expect(treatmentProgress({ currentDay: 3, totalDays: 7 })).toBe(43);
  });

  it('sin fecha de fin no hay porcentaje', () => {
    expect(treatmentProgress({ currentDay: 4, totalDays: null })).toBe(0);
  });

  it('nunca pasa de 100 %', () => {
    expect(treatmentProgress({ currentDay: 9, totalDays: 7 })).toBe(100);
    expect(usagePercent({ used: 20, limit: 15 })).toBe(100);
  });
});
