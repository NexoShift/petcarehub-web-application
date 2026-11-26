import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { forkJoin, of, catchError, map } from 'rxjs';
import { IamStore } from '../../../../iam';
import { Pet } from '../../../../profiles/domain/model/pet.entity';
import { HistoryAccessGrant } from '../../../../profiles/domain/model/history-access-grant.entity';
import { ProfileApi } from '../../../../profiles/infrastructure/profile-api';
import { Icon } from '../../../../shared/presentation/components/icon/icon';
import { PetAvatar } from '../../../../shared/presentation/components/pet-avatar/pet-avatar';
import { MedicalHistoryStore } from '../../../application/medical-history.store';
import { HistoryEntry } from '../../../domain/model/history-entry.entity';
import { AllergyInput, RecordAllergyCommand } from '../../../domain/model/record-allergy.command';
import { RecordVaccinationCommand, VaccinationInput } from '../../../domain/model/record-vaccination.command';
import { AllergyForm } from '../../components/allergy-form/allergy-form';
import { VaccinationForm } from '../../components/vaccination-form/vaccination-form';

type Tab = 'summary' | 'timeline';

/**
 * Historia clínica de una mascota (menú "Historia clínica"). El dueño elige entre sus mascotas;
 * el veterinario entre los pacientes de su clínica. Ambos registran alergias; solo el vet, vacunas.
 */
@Component({
  selector: 'app-medical-history-view',
  imports: [
    DatePipe, RouterLink, MatButtonModule, MatProgressSpinnerModule, TranslatePipe,
    Icon, PetAvatar, AllergyForm, VaccinationForm,
  ],
  templateUrl: './medical-history-view.html',
  styleUrl: './medical-history-view.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MedicalHistoryView implements OnInit {
  /** Query param ?petId= (enlace desde la ficha de la mascota o del paciente). */
  readonly petId = input<string>();

  protected readonly store = inject(MedicalHistoryStore);
  private readonly iam = inject(IamStore);
  private readonly profiles = inject(ProfileApi);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  protected readonly isVet = computed(() => this.iam.currentUser()?.isVeterinarian ?? false);
  protected readonly today = new Date().toLocaleDateString('en-CA');

  protected readonly pets = signal<Pet[]>([]);
  protected readonly petsLoading = signal(true);
  protected readonly query = signal('');
  protected readonly selectedPetId = signal<number | null>(null);
  protected readonly myClinicId = signal<number | null>(null);
  protected readonly tab = signal<Tab>('summary');
  protected readonly showAllergyForm = signal(false);
  protected readonly showVaccinationForm = signal(false);
  /** Vet: permiso vigente del dueño para ver lo de otras clínicas (null = solo ve lo de su clínica). */
  protected readonly accessGrant = signal<HistoryAccessGrant | null>(null);
  protected readonly accessChecked = signal(false);

  /** Nombres de veterinarios y clínicas que aparecen en la historia (se piden una vez por id). */
  protected readonly vetNames = signal<Record<number, string>>({});
  protected readonly clinicNames = signal<Record<number, string>>({});

  private readonly allergyForm = viewChild(AllergyForm);
  private readonly vaccinationForm = viewChild(VaccinationForm);

  protected readonly filteredPets = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.pets();
    return this.pets().filter(
      (p) => p.name.toLowerCase().includes(q) || p.petCode.toLowerCase().includes(q),
    );
  });

  protected readonly selectedPet = computed(
    () => this.pets().find((p) => p.id === this.selectedPetId()) ?? null,
  );

  protected readonly pendingDoses = computed(() => this.store.history()?.pendingDoses(this.today) ?? []);

  /** Línea de tiempo agrupada por año para leerla de un vistazo. */
  protected readonly timeline = computed(() => {
    const groups: { year: number; entries: HistoryEntry[] }[] = [];
    for (const entry of this.store.history()?.entries ?? []) {
      const year = entry.occurredAt.getFullYear();
      const last = groups[groups.length - 1];
      if (last?.year === year) last.entries.push(entry);
      else groups.push({ year, entries: [entry] });
    }
    return groups;
  });

  ngOnInit(): void {
    this.store.clearError();
    const user = this.iam.currentUser();
    if (!user) {
      this.petsLoading.set(false);
      return;
    }
    if (user.isVeterinarian) this.loadClinicPatients(user.accountId);
    else this.loadOwnerPets(user.id);
  }

  private loadOwnerPets(userId: number): void {
    this.profiles.getPetOwnerByUserId(userId).subscribe({
      next: (owner) =>
        this.profiles.getPetsByOwnerId(owner.id).subscribe({
          next: (pets) => this.petsReady(pets),
          error: () => this.petsLoading.set(false),
        }),
      error: () => this.petsLoading.set(false),
    });
  }

  private loadClinicPatients(accountId: number): void {
    this.profiles.getClinicByAccountId(accountId).subscribe({
      next: (clinic) => {
        this.myClinicId.set(clinic.id);
        this.clinicNames.update((names) => ({ ...names, [clinic.id]: clinic.name }));
        this.profiles.getPatientsByClinicId(clinic.id).subscribe({
          next: (pets) => this.petsReady([...pets].sort((a, b) => a.name.localeCompare(b.name))),
          error: () => this.petsLoading.set(false),
        });
        this.profiles.getVeterinariansByClinicId(clinic.id).subscribe({
          next: (vets) =>
            this.vetNames.update((names) => ({
              ...names,
              ...Object.fromEntries(vets.map((v) => [v.id, `${v.firstName} ${v.lastName}`])),
            })),
          error: () => undefined,
        });
      },
      error: () => this.petsLoading.set(false),
    });
  }

  private petsReady(pets: Pet[]): void {
    this.pets.set(pets);
    this.petsLoading.set(false);
    const wanted = Number(this.petId());
    const first = pets.find((p) => p.id === wanted) ?? (this.isVet() ? null : pets[0]);
    if (first) void this.select(first.id);
  }

  protected async select(petId: number): Promise<void> {
    this.selectedPetId.set(petId);
    this.showAllergyForm.set(false);
    this.showVaccinationForm.set(false);
    if (this.isVet()) this.loadAccessGrant(petId);
    if (await this.store.load(petId)) this.resolveNames();
  }

  private loadAccessGrant(petId: number): void {
    this.accessGrant.set(null);
    this.accessChecked.set(false);
    this.profiles.getHistoryAccessGrants(petId).subscribe({
      next: (grants) => {
        if (this.selectedPetId() !== petId) return;
        const now = new Date();
        this.accessGrant.set(grants.find((g) => g.isActiveAt(now)) ?? null);
        this.accessChecked.set(true);
      },
      error: () => this.accessChecked.set(true),
    });
  }

  /** Pide los nombres de veterinarios y clínicas que todavía no conoce. */
  private resolveNames(): void {
    const history = this.store.history();
    if (!history) return;
    const vetIds = new Set<number>();
    const clinicIds = new Set<number>();
    for (const x of [...history.entries, ...history.vaccinations]) {
      if (x.veterinarianId !== null && !(x.veterinarianId in this.vetNames())) vetIds.add(x.veterinarianId);
      if (x.clinicId !== null && !(x.clinicId in this.clinicNames())) clinicIds.add(x.clinicId);
    }
    const vets$ = [...vetIds].map((id) =>
      this.profiles.getVeterinarianById(id).pipe(
        map((v) => [id, `${v.firstName} ${v.lastName}`] as const),
        catchError(() => of(null)),
      ),
    );
    const clinics$ = [...clinicIds].map((id) =>
      this.profiles.getClinicById(id).pipe(
        map((c) => [id, c.name] as const),
        catchError(() => of(null)),
      ),
    );
    if (vets$.length) {
      forkJoin(vets$).subscribe((pairs) =>
        this.vetNames.update((names) => ({ ...names, ...Object.fromEntries(pairs.filter((p) => p !== null)) })),
      );
    }
    if (clinics$.length) {
      forkJoin(clinics$).subscribe((pairs) =>
        this.clinicNames.update((names) => ({ ...names, ...Object.fromEntries(pairs.filter((p) => p !== null)) })),
      );
    }
  }

  /** Enlace al detalle de la consulta; el vet solo abre las de su clínica. */
  protected consultationLink(entry: HistoryEntry): (string | number)[] | null {
    if (entry.consultationId === null) return null;
    if (!this.isVet()) return ['/my-consultations', entry.consultationId];
    return entry.clinicId === this.myClinicId() ? ['/consultations', entry.consultationId] : null;
  }

  protected async recordAllergy(input: AllergyInput): Promise<void> {
    const petId = this.selectedPetId();
    if (petId === null) return;
    let command: RecordAllergyCommand;
    try {
      command = new RecordAllergyCommand(petId, input);
    } catch (error) {
      this.store.fail(error);
      return;
    }
    if (await this.store.recordAllergy(command)) {
      this.allergyForm()?.reset();
      this.showAllergyForm.set(false);
      this.notify('medicalHistory.allergies.saved');
    }
  }

  protected async recordVaccination(input: VaccinationInput): Promise<void> {
    const petId = this.selectedPetId();
    if (petId === null) return;
    let command: RecordVaccinationCommand;
    try {
      command = new RecordVaccinationCommand(petId, input, this.today);
    } catch (error) {
      this.store.fail(error);
      return;
    }
    if (await this.store.recordVaccination(command)) {
      this.vaccinationForm()?.reset();
      this.showVaccinationForm.set(false);
      this.notify('medicalHistory.vaccinations.saved');
      this.resolveNames();
    }
  }

  private notify(key: string): void {
    this.snackBar.open(this.translate.instant(key), this.translate.instant('medicalHistory.close'), {
      duration: 3000,
    });
  }
}
