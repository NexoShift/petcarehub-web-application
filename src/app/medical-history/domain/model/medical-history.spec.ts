import { describe, expect, it } from 'vitest';
import { AllergyReporter } from '../enums/allergy-reporter.enum';
import { AllergySeverity } from '../enums/allergy-severity.enum';
import { HistoryEntryType } from '../enums/history-entry-type.enum';
import { Allergy } from './allergy.entity';
import { HistoryEntry } from './history-entry.entity';
import { MedicalHistory } from './medical-history.entity';
import { MedicalHistoryErrorCode } from './medical-history-error';
import { RecordAllergyCommand } from './record-allergy.command';
import { RecordVaccinationCommand, VaccinationInput } from './record-vaccination.command';
import { Vaccination } from './vaccination.entity';

const TODAY = '2026-11-25';

const allergy = (id: number, severity: AllergySeverity, at = '2026-01-01T00:00:00Z') =>
  new Allergy(id, `A${id}`, null, severity, null, AllergyReporter.Owner, new Date(at));
const vaccination = (id: number, appliedOn: string, nextDoseOn: string | null) =>
  new Vaccination(id, `V${id}`, 1, appliedOn, nextDoseOn, null, null, 5, 1);
const entry = (id: number, at: string) =>
  new HistoryEntry(id, HistoryEntryType.ConsultationCompleted, id, id, 1, 5, null, 'x', new Date(at));

const vaccineInput = (overrides: Partial<VaccinationInput> = {}): VaccinationInput => ({
  vaccineName: 'Antirrábica', appliedOn: TODAY, doseNumber: 1, nextDoseOn: '2027-11-25',
  batchNumber: '', notes: '', ...overrides,
});

describe('MedicalHistory', () => {
  it('orders severe allergies first and latest vaccinations and events first', () => {
    const history = new MedicalHistory(
      1,
      [allergy(1, AllergySeverity.Mild), allergy(2, AllergySeverity.Severe), allergy(3, AllergySeverity.Moderate)],
      [vaccination(1, '2025-01-10', null), vaccination(2, '2026-03-01', null)],
      [entry(1, '2025-05-01T10:00:00Z'), entry(2, '2026-05-01T10:00:00Z')],
    );
    expect(history.allergies.map((a) => a.id)).toEqual([2, 3, 1]);
    expect(history.vaccinations.map((v) => v.id)).toEqual([2, 1]);
    expect(history.entries.map((e) => e.id)).toEqual([2, 1]);
    expect(history.hasSevereAllergy).toBe(true);
  });

  it('lists overdue and soon-due boosters, nearest first', () => {
    const history = new MedicalHistory(1, [], [
      vaccination(1, '2025-11-01', '2026-12-10'), // soon
      vaccination(2, '2025-10-01', '2026-11-01'), // overdue
      vaccination(3, '2026-11-01', '2027-11-01'), // far
      vaccination(4, '2026-11-01', null),
    ], []);
    expect(history.pendingDoses(TODAY).map((v) => v.id)).toEqual([2, 1]);
    expect(history.vaccinations.find((v) => v.id === 2)!.isOverdueOn(TODAY)).toBe(true);
    expect(history.vaccinations.find((v) => v.id === 1)!.isDueSoonOn(TODAY)).toBe(true);
  });
});

describe('RecordAllergyCommand', () => {
  it('trims and turns blank optional fields into null', () => {
    const command = new RecordAllergyCommand(4, {
      allergen: '  Pollo ', reaction: ' ', severity: AllergySeverity.Moderate, notes: '',
    });
    expect(command).toMatchObject({ petId: 4, allergen: 'Pollo', reaction: null, notes: null, severity: 'MODERATE' });
  });

  it('requires an allergen and a severity', () => {
    expect(() => new RecordAllergyCommand(4, { allergen: ' ', reaction: '', severity: AllergySeverity.Mild, notes: '' }))
      .toThrow(MedicalHistoryErrorCode.InvalidAllergy);
    expect(() => new RecordAllergyCommand(4, { allergen: 'Pollo', reaction: '', severity: null, notes: '' }))
      .toThrow(MedicalHistoryErrorCode.InvalidAllergy);
  });
});

describe('RecordVaccinationCommand', () => {
  it('accepts a valid vaccine and drops blank optionals', () => {
    const command = new RecordVaccinationCommand(4, vaccineInput({ nextDoseOn: '', doseNumber: null }), TODAY);
    expect(command).toMatchObject({ vaccineName: 'Antirrábica', nextDoseOn: null, doseNumber: null, batchNumber: null });
  });

  it('rejects a future application date or a next dose not after it', () => {
    expect(() => new RecordVaccinationCommand(4, vaccineInput({ appliedOn: '2026-11-26' }), TODAY))
      .toThrow(MedicalHistoryErrorCode.InvalidVaccinationDates);
    expect(() => new RecordVaccinationCommand(4, vaccineInput({ nextDoseOn: TODAY }), TODAY))
      .toThrow(MedicalHistoryErrorCode.InvalidVaccinationDates);
  });

  it('rejects a dose outside 1..20 and a missing name', () => {
    expect(() => new RecordVaccinationCommand(4, vaccineInput({ doseNumber: 21 }), TODAY))
      .toThrow(MedicalHistoryErrorCode.InvalidVaccination);
    expect(() => new RecordVaccinationCommand(4, vaccineInput({ vaccineName: '' }), TODAY))
      .toThrow(MedicalHistoryErrorCode.InvalidVaccination);
  });
});
