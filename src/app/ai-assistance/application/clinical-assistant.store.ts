import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { AssistantError } from '../domain/model/assistant-error';
import { ClinicalAssistance } from '../domain/model/clinical-assistance.entity';
import { BackgroundType, ClinicalBackground, MAX_BACKGROUNDS, backgroundKey } from '../domain/model/clinical-background';
import { PetOption } from '../domain/model/pet-option';
import { RequestClinicalAssistanceCommand } from '../domain/model/request-clinical-assistance.command';
import { DraftDecision } from '../domain/model/soap-draft.entity';
import { ClinicalAssistanceRepository } from '../domain/repositories/clinical-assistance.repository';
import { ActiveConsultation } from '../domain/model/owner-clinical-context';
import { PetOptionsApi } from '../infrastructure/pet-options.api';
import { ReferenceConsultationsApi } from '../infrastructure/reference-consultations.api';

/** Qué está haciendo el asistente ahora (para deshabilitar botones y mostrar el spinner correcto). */
export type AssistantBusy = 'loading' | 'generating' | 'regenerating' | 'deciding' | 'report' | null;

/**
 * Estado del Asistente clínico (vet): paciente, consulta, antecedentes marcados y la asistencia
 * con sus borradores. Se provee en la ruta /ai-assistant.
 */
@Injectable()
export class ClinicalAssistantStore {
  private readonly repository = inject(ClinicalAssistanceRepository);
  private readonly petsApi = inject(PetOptionsApi);
  private readonly consultationsApi = inject(ReferenceConsultationsApi);

  private readonly _pets = signal<PetOption[]>([]);
  private readonly _petId = signal<number | null>(null);
  private readonly _consultationId = signal<number | null>(null);
  /** Consultas en curso del paciente elegido (el selector de "Consulta"). */
  private readonly _activeConsultations = signal<ActiveConsultation[]>([]);
  private readonly _consultationsLoading = signal(false);
  private readonly _backgrounds = signal<ClinicalBackground[]>([]);
  private readonly _selected = signal<Set<string>>(new Set());
  private readonly _assistance = signal<ClinicalAssistance | null>(null);
  private readonly _activeDraftId = signal<number | null>(null);
  private readonly _busy = signal<AssistantBusy>(null);
  private readonly _error = signal<AssistantError | null>(null);
  private readonly reportUrls = new Map<number, string>();

  readonly pets = this._pets.asReadonly();
  readonly consultationId = this._consultationId.asReadonly();
  readonly activeConsultations = this._activeConsultations.asReadonly();
  readonly consultationsLoading = this._consultationsLoading.asReadonly();
  readonly backgrounds = this._backgrounds.asReadonly();
  readonly selected = this._selected.asReadonly();
  readonly assistance = this._assistance.asReadonly();
  readonly busy = this._busy.asReadonly();
  readonly error = this._error.asReadonly();

  readonly selectedPet = computed(() => this._pets().find(p => p.id === this._petId()) ?? null);
  readonly consultations = computed(() => this._backgrounds().filter(b => b.type === BackgroundType.PreviousConsultation));
  readonly visionAnalyses = computed(() => this._backgrounds().filter(b => b.type === BackgroundType.VisionAnalysis));
  readonly selectedCount = computed(() => this._selected().size);
  readonly limitReached = computed(() => this._selected().size >= MAX_BACKGROUNDS);
  /** Borrador que se muestra: el elegido en las pestañas o el último. */
  readonly activeDraft = computed(() => {
    const a = this._assistance();
    if (!a) return null;
    return a.findDraft(this._activeDraftId() ?? -1) ?? a.confirmedDraft ?? a.latestDraft;
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.reportUrls.forEach(url => URL.revokeObjectURL(url)));
  }

  loadPets(preferredPetId?: number | null, preferredConsultationId?: number | null): void {
    this.petsApi.vetPatients().subscribe(pets => {
      this._pets.set(pets);
      const pet = pets.find(p => p.id === preferredPetId) ?? pets[0];
      if (pet) this.selectPet(pet.id, preferredPetId === pet.id ? preferredConsultationId : null);
    });
  }

  /** Cambia de paciente: trae sus consultas en curso, sus antecedentes y la asistencia de la consulta. */
  selectPet(petId: number, consultationId?: number | null): void {
    this._petId.set(petId);
    this._backgrounds.set([]);
    this._selected.set(new Set());
    this._activeConsultations.set([]);
    this.setConsultation(null);
    this._consultationsLoading.set(true);
    this.consultationsApi
      .inProgressByPet(petId)
      .pipe(finalize(() => this._consultationsLoading.set(false)))
      .subscribe(list => {
        if (this._petId() !== petId) return;
        this._activeConsultations.set(list);
        const chosen = list.find(c => c.id === consultationId) ?? list[0];
        this.setConsultation(chosen?.id ?? null);
        this.loadBackgrounds(petId);
      });
  }

  private loadBackgrounds(petId: number): void {
    this.repository.findBackgrounds(petId).subscribe({
      next: list => {
        if (this._petId() !== petId) return;
        // Por defecto se marcan las consultas anteriores (no la actual) y todos los análisis de visión
        const current = this._consultationId();
        const sorted = [...list].sort((a, b) => b.date.localeCompare(a.date));
        this._backgrounds.set(sorted);
        this._selected.set(new Set(
          sorted.filter(b => !(b.type === BackgroundType.PreviousConsultation && b.referenceId === current))
            .slice(0, MAX_BACKGROUNDS).map(backgroundKey),
        ));
      },
      error: (e: AssistantError) => this._error.set(e),
    });
  }

  /** Cambia la consulta y busca si ya tiene una asistencia (GET ?consultationId). */
  setConsultation(consultationId: number | null): void {
    this._consultationId.set(consultationId);
    this._assistance.set(null);
    this._activeDraftId.set(null);
    this._error.set(null);
    if (!consultationId) return;
    this._busy.set('loading');
    this.repository
      .findByConsultationId(consultationId)
      .pipe(finalize(() => this._busy.set(null)))
      .subscribe({
        next: a => { if (this._consultationId() === consultationId) this._assistance.set(a); },
        error: () => this._assistance.set(null),
      });
  }

  toggle(background: ClinicalBackground): void {
    const key = backgroundKey(background);
    this._selected.update(set => {
      const next = new Set(set);
      if (next.has(key)) next.delete(key);
      else if (next.size < MAX_BACKGROUNDS) next.add(key);
      return next;
    });
  }

  isSelected(background: ClinicalBackground): boolean {
    return this._selected().has(backgroundKey(background));
  }

  generate(currentReason: string): void {
    let command: RequestClinicalAssistanceCommand;
    try {
      command = RequestClinicalAssistanceCommand.create({
        consultationId: this._consultationId(),
        petId: this._petId(),
        currentReason,
        backgrounds: this._backgrounds().filter(b => this._selected().has(backgroundKey(b)))
          .map(b => ({ type: b.type, referenceId: b.referenceId })),
      });
    } catch (e) {
      this._error.set(e as AssistantError);
      return;
    }
    this.run('generating', this.repository.request(command));
  }

  regenerate(): void {
    const a = this._assistance();
    if (a?.canRegenerate) this.run('regenerating', this.repository.regenerate(a.id), true);
  }

  showDraft(draftId: number): void {
    this._activeDraftId.set(draftId);
  }

  decide(decision: DraftDecision, editedText?: string): void {
    const a = this._assistance();
    const draft = this.activeDraft();
    if (!a || !draft) return;
    if (decision === DraftDecision.Edited && !editedText?.trim()) {
      this._error.set(AssistantError.MissingEdit);
      return;
    }
    this._activeDraftId.set(draft.id);
    this.run('deciding', this.repository.decide(a.id, draft.id, decision, editedText?.trim()));
  }

  /** Descarga el PDF una vez y devuelve su object URL (para abrirlo o bajarlo). */
  openReport(onReady: (url: string) => void): void {
    const draft = this.activeDraft();
    if (!draft?.reportUrl) return;
    const cached = this.reportUrls.get(draft.id);
    if (cached) return onReady(cached);
    this._busy.set('report');
    this.repository
      .loadReport(draft.reportUrl)
      .pipe(finalize(() => this._busy.set(null)))
      .subscribe({
        next: blob => {
          const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
          this.reportUrls.set(draft.id, url);
          onReady(url);
        },
        error: (e: AssistantError) => this._error.set(e),
      });
  }

  clearError(): void {
    this._error.set(null);
  }

  private run(busy: AssistantBusy, source: ReturnType<ClinicalAssistanceRepository['request']>, showLatest = false): void {
    this._error.set(null);
    this._busy.set(busy);
    source.pipe(finalize(() => this._busy.set(null))).subscribe({
      next: a => {
        this._assistance.set(a);
        if (showLatest || busy === 'generating') this._activeDraftId.set(a.latestDraft?.id ?? null);
      },
      error: (e: AssistantError) => this._error.set(e),
    });
  }
}
