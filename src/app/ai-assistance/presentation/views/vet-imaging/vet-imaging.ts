import { Component, DestroyRef, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../../../shared/presentation/components/icon/icon';
import { PetAvatar } from '../../../../shared/presentation/components/pet-avatar/pet-avatar';
import { VisionStore } from '../../../application/vision.store';
import { ImageType } from '../../../domain/model/image-type';
import { VisionAnalysis } from '../../../domain/model/vision-analysis.entity';
import { VisionError } from '../../../domain/model/vision-error';
import { AnalysisHistory } from '../../components/analysis-history/analysis-history';
import { AnalysisSteps } from '../../components/analysis-steps/analysis-steps';
import { FindingsPanel } from '../../components/findings-panel/findings-panel';
import { PickedImage, captionOf, readPickedImage } from '../../components/image-picker';
import { VisionViewer } from '../../components/vision-viewer/vision-viewer';
import { FindingLabelPipe } from '../../pipes/finding-label.pipe';

type HistoryFilter = 'ALL' | ImageType;

/**
 * Imagenología (veterinario). Mismo diseño que la pantalla del dueño, con lo que necesita el vet:
 * - elige paciente y consulta (se puede abrir con ?petId=1&consultationId=4);
 * - elige el tipo: foto de piel (cajas) o radiografía (panel de probabilidades + modo señalar);
 * - ve todos los estudios de la mascota, también las fotos que subió el dueño;
 * - el análisis queda como antecedente para el Asistente clínico (LLM).
 */
@Component({
  selector: 'app-vet-imaging',
  imports: [
    TranslatePipe, FormsModule, RouterLink,
    MatSelectModule, MatFormFieldModule, MatInputModule, MatButtonToggleModule, MatSlideToggleModule, MatTooltipModule,
    Icon, PetAvatar, VisionViewer, FindingsPanel, AnalysisSteps, AnalysisHistory, FindingLabelPipe,
  ],
  templateUrl: './vet-imaging.html',
  styleUrls: ['../ai-page.css', '../vision-layout.css', './vet-imaging.css'],
})
export class VetImaging {
  /** Parámetros opcionales de la URL (withComponentInputBinding). */
  readonly petId = input<string>();
  readonly consultationId = input<string>();

  protected readonly store = inject(VisionStore);
  protected readonly ImageType = ImageType;

  protected readonly imageType = signal<ImageType>(ImageType.Skin);
  protected readonly consultation = signal<number | null>(null);
  protected readonly picked = signal<PickedImage | null>(null);
  protected readonly pointer = signal(true);
  protected readonly filter = signal<HistoryFilter>('ALL');
  private readonly urls: string[] = [];

  /** Tipo que se muestra en el visor: el del análisis abierto o el elegido para subir. */
  protected readonly viewerType = computed(() => this.store.current()?.imageType ?? this.imageType());
  protected readonly viewerSrc = computed(() => {
    const current = this.store.current();
    if (current && !this.picked()) return this.store.images()[current.id] ?? null;
    return this.picked()?.url ?? null;
  });
  protected readonly caption = computed(() => captionOf(this.picked()));
  protected readonly canAnalyze = computed(() => !!this.picked() && !this.store.processing() && !this.store.current());
  protected readonly filteredHistory = computed(() => {
    const f = this.filter();
    return f === 'ALL' ? this.store.history() : this.store.history().filter(a => a.imageType === f);
  });
  protected readonly ownerUploads = computed(() => this.store.history().filter(a => a.requestedByRole === 'PET_OWNER').length);

  constructor() {
    // Carga los pacientes una vez, eligiendo el de la URL si vino
    effect(() => {
      const fromUrl = Number(this.petId()) || null;
      untracked(() => this.store.loadPets(true, fromUrl));
    });
    // Al cambiar de paciente, precarga su consulta en curso (o la de la URL)
    effect(() => {
      const pet = this.store.selectedPet();
      const fromUrl = Number(this.consultationId()) || null;
      untracked(() => this.consultation.set(fromUrl && pet?.id === Number(this.petId()) ? fromUrl : (pet?.activeConsultationId ?? null)));
    });
    inject(DestroyRef).onDestroy(() => this.urls.forEach(u => URL.revokeObjectURL(u)));
  }

  protected selectPet(id: number): void {
    this.picked.set(null);
    this.store.selectPet(id);
  }

  protected setType(type: ImageType): void {
    this.imageType.set(type);
    // Si estaba viendo un resultado, el cambio de tipo prepara un estudio nuevo
    if (this.store.current()) this.newStudy();
  }

  protected async onFile(file: File | null | undefined): Promise<void> {
    if (!file) return;
    try {
      const image = await readPickedImage(file);
      this.urls.push(image.url);
      this.store.reset();
      this.picked.set(image);
    } catch (e) {
      this.store.setError(e as VisionError);
    }
  }

  protected fromInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    void this.onFile(input.files?.[0]);
    input.value = '';
  }

  protected analyze(): void {
    const image = this.picked();
    if (!image) return;
    this.store.analyze({
      file: image.file,
      imageType: this.imageType(),
      consultationId: this.consultation(),
      previewUrl: image.url,
    });
  }

  protected newStudy(): void {
    this.picked.set(null);
    this.store.reset();
  }

  protected openFromHistory(analysis: VisionAnalysis): void {
    this.picked.set(null);
    this.imageType.set(analysis.imageType);
    this.store.show(analysis);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
