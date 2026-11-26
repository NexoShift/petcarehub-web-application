import { Allergy } from './allergy.entity';
import { HistoryEntry } from './history-entry.entity';
import { Vaccination } from './vaccination.entity';

/** The pet's medical history: allergies, vaccinations and the clinical timeline. */
export class MedicalHistory {
  readonly allergies: Allergy[];
  readonly vaccinations: Vaccination[];
  readonly entries: HistoryEntry[];

  constructor(
    readonly petId: number,
    allergies: Allergy[],
    vaccinations: Vaccination[],
    entries: HistoryEntry[],
  ) {
    // Severe allergies first; latest vaccinations and events first
    const weight = (a: Allergy) => (a.isSevere ? 0 : a.severity === 'MODERATE' ? 1 : 2);
    this.allergies = [...allergies].sort((a, b) => weight(a) - weight(b) || b.recordedAt.getTime() - a.recordedAt.getTime());
    this.vaccinations = [...vaccinations].sort((a, b) => b.appliedOn.localeCompare(a.appliedOn));
    this.entries = [...entries].sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
  }

  get hasSevereAllergy(): boolean {
    return this.allergies.some((a) => a.isSevere);
  }

  /** Vaccinations whose next dose is overdue or due soon, nearest first. */
  pendingDoses(today: string): Vaccination[] {
    return this.vaccinations
      .filter((v) => v.isOverdueOn(today) || v.isDueSoonOn(today))
      .sort((a, b) => (a.nextDoseOn ?? '').localeCompare(b.nextDoseOn ?? ''));
  }
}
