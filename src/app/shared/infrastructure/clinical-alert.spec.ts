import { AllergyReporter } from '../../medical-history/domain/enums/allergy-reporter.enum';
import { AllergySeverity } from '../../medical-history/domain/enums/allergy-severity.enum';
import { Allergy } from '../../medical-history/domain/model/allergy.entity';
import { MedicalHistory } from '../../medical-history/domain/model/medical-history.entity';
import { Vaccination } from '../../medical-history/domain/model/vaccination.entity';
import { Pet } from '../../profiles/domain/model/pet.entity';
import { pickClinicalAlert } from './dashboard.api';

const pet = (id: number, name: string) => new Pet(id, 1, `PET-${id}`, name, 'DOG', null, null, null, null);
const allergy = (allergen: string, severity: AllergySeverity) =>
  new Allergy(1, allergen, 'Urticaria', severity, null, AllergyReporter.Veterinarian, new Date('2026-10-01'));
const vaccine = (name: string, next: string | null) =>
  new Vaccination(1, name, 1, '2025-11-01', next, null, null, 7, 3);

describe('pickClinicalAlert', () => {
  const today = '2026-11-26';

  it('returns null without severe allergies or overdue vaccines', () => {
    const history = new MedicalHistory(1, [allergy('Polen', AllergySeverity.Mild)], [vaccine('Rabia', '2027-01-10')], []);
    expect(pickClinicalAlert([{ pet: pet(1, 'Rocky'), history }, { pet: pet(2, 'Luna'), history: null }], today)).toBeNull();
  });

  it('puts the oldest overdue vaccine first and counts the other alerts', () => {
    const rocky = new MedicalHistory(1, [allergy('Penicilina', AllergySeverity.Severe)], [vaccine('Rabia', '2026-11-20')], []);
    const luna = new MedicalHistory(2, [], [vaccine('Parvovirus', '2026-10-05')], []);
    const alert = pickClinicalAlert([{ pet: pet(1, 'Rocky'), history: rocky }, { pet: pet(2, 'Luna'), history: luna }], today)!;
    expect(alert).toEqual({
      kind: 'vaccine', petId: 2, pet: 'Luna', subject: 'Parvovirus', detail: null, dueOn: '2026-10-05', others: 2,
    });
  });

  it('shows a severe allergy when no vaccine is overdue', () => {
    const history = new MedicalHistory(1, [allergy('Penicilina', AllergySeverity.Severe)], [], []);
    const alert = pickClinicalAlert([{ pet: pet(1, 'Rocky'), history }], today)!;
    expect(alert.kind).toBe('allergy');
    expect(alert.subject).toBe('Penicilina');
    expect(alert.detail).toBe('Urticaria');
    expect(alert.others).toBe(0);
  });
});
