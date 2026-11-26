import { ConsultationStatus } from '../../clinical-attention/domain/enums/consultation-status.enum';
import { TreatmentStatus } from '../../clinical-attention/domain/enums/treatment-status.enum';
import { ClinicalConsultation } from '../../clinical-attention/domain/model/clinical-consultation.entity';
import { Prescription } from '../../clinical-attention/domain/model/prescription.entity';
import { Treatment } from '../../clinical-attention/domain/model/treatment.entity';
import { Pet } from '../../profiles/domain/model/pet.entity';
import { pickActiveTreatment, toActiveTreatment } from './dashboard.api';

const pet = (id: number, name: string) => new Pet(id, 1, `PET-${id}`, name, 'DOG', 'Mestizo', null, null, null);

const treatment = (id: number, start: string, end: string | null, status = TreatmentStatus.Active) =>
  new Treatment(id, `Tratamiento ${id}`, 'Dar con comida', start, end, status, 7, new Date('2026-11-01'));

const prescription = (id: number, issuedAt: string, names: string[]) =>
  new Prescription(
    id,
    new Date(issuedAt),
    'Volver si hay vómitos',
    names.map((name, i) => ({ id: i + 1, name, dosage: '10 mg', frequency: 'cada 12 h', duration: '5 días', indication: null })),
    7,
  );

const consultation = (id: number, petId: number, treatments: Treatment[], prescriptions: Prescription[] = []) =>
  new ClinicalConsultation({
    id, petId, veterinarianId: 7, clinicId: 3, consultingRoomId: null, reason: 'Control',
    status: ConsultationStatus.Completed, startedAt: null, completedAt: null,
    cancellationReason: null, cancelledAt: null, anamnesis: null,
    physiologicalAssessments: [], findings: [], diagnoses: [],
    treatments, prescriptions, createdAt: new Date('2026-11-01'), updatedAt: new Date('2026-11-01'),
  });

describe('pickActiveTreatment', () => {
  const today = '2026-11-26';

  it('returns null when no treatment is current today', () => {
    const data = [{
      pet: pet(1, 'Rocky'),
      consultations: [consultation(10, 1, [
        treatment(1, '2026-11-01', '2026-11-10'),
        treatment(2, '2026-11-20', null, TreatmentStatus.Suspended),
        treatment(3, '2026-11-27', null),
      ])],
    }];
    expect(pickActiveTreatment(data, today)).toBeNull();
  });

  it('picks the most recently started current treatment across pets with its latest prescription', () => {
    const data = [
      { pet: pet(1, 'Rocky'), consultations: [consultation(10, 1, [treatment(1, '2026-11-20', null)])] },
      {
        pet: pet(2, 'Luna'),
        consultations: [consultation(20, 2, [treatment(2, '2026-11-24', '2026-11-30')], [
          prescription(1, '2026-11-24T10:00:00Z', ['Antiguo']),
          prescription(2, '2026-11-24T11:00:00Z', ['Amoxicilina', 'Omeprazol']),
        ])],
      },
    ];
    const picked = pickActiveTreatment(data, today)!;
    expect(picked.pet.name).toBe('Luna');
    expect(picked.treatment.id).toBe(2);
    expect(picked.prescription?.id).toBe(2);
    expect(picked.others).toBe(1);
  });
});

describe('toActiveTreatment', () => {
  it('counts the day of a treatment with an end date and maps the medications', () => {
    const c = consultation(20, 2, [], []);
    const t = toActiveTreatment(pet(2, 'Luna'), c, treatment(2, '2026-11-24', '2026-11-30'),
      prescription(2, '2026-11-24T11:00:00Z', ['Amoxicilina']), '2026-11-26',
      { vet: 'Ana Pérez', clinic: 'Clínica Sur', others: 0 });
    expect(t.currentDay).toBe(3);
    expect(t.totalDays).toBe(7);
    expect(t.medications).toEqual([{ name: 'Amoxicilina', dosage: '10 mg', frequency: 'cada 12 h', duration: '5 días' }]);
    expect(t.generalInstruction).toBe('Volver si hay vómitos');
    expect(t.prescribedBy).toBe('Ana Pérez');
  });

  it('has no total days when there is no end date and no medications without a prescription', () => {
    const t = toActiveTreatment(pet(1, 'Rocky'), consultation(10, 1, []), treatment(1, '2026-11-20', null), null,
      '2026-11-26', { vet: '', clinic: '', others: 2 });
    expect(t.totalDays).toBeNull();
    expect(t.currentDay).toBe(7);
    expect(t.medications).toEqual([]);
    expect(t.generalInstruction).toBeNull();
    expect(t.otherActive).toBe(2);
  });
});
