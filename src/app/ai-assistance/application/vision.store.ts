import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { ImageType } from '../domain/model/image-type';
import { PetOption } from '../domain/model/pet-option';
import { RequestVisionAnalysisCommand } from '../domain/model/request-vision-analysis.command';
import { VisionAnalysis } from '../domain/model/vision-analysis.entity';
import { VisionError } from '../domain/model/vision-error';
import { VisionAnalysisRepository } from '../domain/repositories/vision-analysis.repository';
import { orientativeTriage } from '../domain/services/orientative-triage';
import { PetOptionsApi } from '../infrastructure/pet-options.api';

/** En qué paso va el análisis actual (la línea Pendiente → Procesando → Completado). */
export type AnalysisPhase = 'pending' | 'processing' | 'completed' | 'failed';

/** Las dos "ranuras" de la pantalla: la foto principal y la comparativa (la otra pata). */
export type AnalysisSlot = 'main' | 'comparison';

/**
 * Estado de la pantalla de visión. Se provee en cada ruta (no es global),
 * así la pantalla del dueño y la del vet tienen su propio estado y se limpia al salir.
 * Las vistas nunca llaman al repositorio ni a HttpClient.
 */
@Injectable()
export class VisionStore {
  private readonly repository = inject(VisionAnalysisRepository);
  private readonly petsApi = inject(PetOptionsApi);

  private readonly _pets = signal<PetOption[]>([]);
  /** true cuando ya respondió Profiles (para no mostrar "sin mascotas" mientras carga). */
  private readonly _petsLoaded = signal(false);
  private readonly _selectedPetId = signal<number | null>(null);
  private readonly _history = signal<VisionAnalysis[]>([]);
  private readonly _historyLoading = signal(false);
  private readonly _current = signal<VisionAnalysis | null>(null);
  private readonly _comparison = signal<VisionAnalysis | null>(null);
  private readonly _processing = signal<AnalysisSlot | null>(null);
  private readonly _error = signal<VisionError | null>(null);
  /** Análisis hechos en esta pantalla (para descontar de la cuota del plan sin recargar). */
  private readonly _analyzedNow = signal(0);
  /** id del análisis → object URL de su imagen (blob). */
  private readonly _images = signal<Record<number, string>>({});
  private readonly requestedImages = new Set<number>();

  readonly pets = this._pets.asReadonly();
  readonly petsLoaded = this._petsLoaded.asReadonly();
  readonly history = this._history.asReadonly();
  readonly historyLoading = this._historyLoading.asReadonly();
  readonly current = this._current.asReadonly();
  readonly comparison = this._comparison.asReadonly();
  readonly processing = this._processing.asReadonly();
  readonly error = this._error.asReadonly();
  readonly analyzedNow = this._analyzedNow.asReadonly();
  readonly images = this._images.asReadonly();

  readonly selectedPet = computed(
    () => this._pets().find((p) => p.id === this._selectedPetId()) ?? null,
  );
  readonly phase = computed<AnalysisPhase>(() => {
    if (this._processing() === 'main') return 'processing';
    const current = this._current();
    if (!current) return 'pending';
    return current.isCompleted ? 'completed' : 'failed';
  });
  readonly triage = computed(() => {
    const current = this._current();
    return current ? orientativeTriage(current) : null;
  });

  constructor() {
    // Libera las imágenes en memoria al salir de la pantalla
    inject(DestroyRef).onDestroy(() =>
      Object.values(this._images()).forEach((url) => URL.revokeObjectURL(url)),
    );
  }

  /** Carga las mascotas (del dueño o pacientes del vet) y elige la indicada o la primera. */
  loadPets(forVet: boolean, preferredPetId?: number | null): void {
    const source = forVet ? this.petsApi.vetPatients() : this.petsApi.ownerPets();
    source.subscribe((pets) => {
      this._pets.set(pets);
      this._petsLoaded.set(true);
      const preferred = pets.find((p) => p.id === preferredPetId);
      this.selectPet((preferred ?? pets[0])?.id ?? null);
    });
  }

  /** Cambia de mascota: limpia el análisis en pantalla y trae su historial. */
  selectPet(petId: number | null): void {
    if (petId === this._selectedPetId()) return;
    this._selectedPetId.set(petId);
    this.reset();
    this._history.set([]);
    if (petId) this.loadHistory(petId);
  }

  loadHistory(petId: number): void {
    this._historyLoading.set(true);
    this.repository
      .findByPetId(petId)
      .pipe(finalize(() => this._historyLoading.set(false)))
      .subscribe({
        next: (list) => {
          // Si mientras tanto cambió la mascota, se descarta la respuesta vieja
          if (this._selectedPetId() === petId) this._history.set(list);
        },
        error: (e: VisionError) => this._error.set(e),
      });
  }

  /**
   * Sube y analiza. previewUrl es la imagen que ya se ve en pantalla: se reutiliza
   * para no volver a descargarla. Devuelve false si el archivo no pasó la validación.
   */
  analyze(params: {
    file: File | null;
    imageType: ImageType | null;
    consultationId?: number | null;
    previewUrl?: string | null;
    slot?: AnalysisSlot;
  }): boolean {
    const slot = params.slot ?? 'main';
    let command: RequestVisionAnalysisCommand;
    try {
      command = RequestVisionAnalysisCommand.create({ ...params, petId: this._selectedPetId() });
    } catch (e) {
      this._error.set(e as VisionError);
      return false;
    }
    this._error.set(null);
    this._processing.set(slot);
    this.repository
      .analyze(command)
      .pipe(finalize(() => this._processing.set(null)))
      .subscribe({
        next: (analysis) => {
          if (params.previewUrl) this.rememberImage(analysis.id, params.previewUrl);
          (slot === 'main' ? this._current : this._comparison).set(analysis);
          this._history.update((list) => [analysis, ...list.filter((a) => a.id !== analysis.id)]);
          if (slot === 'main') this._analyzedNow.update((n) => n + 1);
        },
        error: (e: VisionError) => this._error.set(e),
      });
    return true;
  }

  /** Muestra un análisis guardado (del historial) como el principal. */
  show(analysis: VisionAnalysis): void {
    this._current.set(analysis);
    this._comparison.set(null);
    this._error.set(null);
    this.ensureImage(analysis);
  }

  /** Pide la imagen de un análisis una sola vez y la guarda como object URL. */
  ensureImage(analysis: VisionAnalysis): void {
    if (this._images()[analysis.id] || this.requestedImages.has(analysis.id)) return;
    this.requestedImages.add(analysis.id);
    this.repository.loadImage(analysis).subscribe({
      next: (blob) => this.rememberImage(analysis.id, URL.createObjectURL(blob)),
      error: () => this.requestedImages.delete(analysis.id),
    });
  }

  /** Quita la comparativa. */
  clearComparison(): void {
    this._comparison.set(null);
  }

  /** Vuelve al estado "Pendiente" (nueva foto). */
  reset(): void {
    this._current.set(null);
    this._comparison.set(null);
    this._error.set(null);
  }

  setError(error: VisionError | null): void {
    this._error.set(error);
  }

  private rememberImage(id: number, url: string): void {
    this._images.update((map) => ({ ...map, [id]: url }));
  }
}
