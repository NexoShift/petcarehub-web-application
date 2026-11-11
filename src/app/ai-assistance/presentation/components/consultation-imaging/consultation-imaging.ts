import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../../../shared/presentation/components/icon/icon';
import { VisionStore } from '../../../application/vision.store';
import { ImageType } from '../../../domain/model/image-type';
import { VisionAnalysis } from '../../../domain/model/vision-analysis.entity';
import { VisionError } from '../../../domain/model/vision-error';
import { VISION_PROVIDERS } from '../../../vision.providers';
import { FindingLabelPipe } from '../../pipes/finding-label.pipe';
import { AnalysisHistory } from '../analysis-history/analysis-history';
import { AnalysisSteps } from '../analysis-steps/analysis-steps';
import { FindingsPanel } from '../findings-panel/findings-panel';
import { PickedImage, captionOf, readPickedImage } from '../image-picker';
import { VisionViewer } from '../vision-viewer/vision-viewer';

/**
 * Paso "Imágenes" de la consulta (fase 3). Es la misma visión por computadora de /imaging,
 * pero con el paciente y la consulta ya fijados: el vet solo elige el tipo, sube y analiza.
 * Cada análisis se guarda con el consultationId, así queda como antecedente de esta consulta.
 * Tiene su propio VisionStore (providers del componente): se limpia al cambiar de fase.
 */
@Component({
  selector: 'app-consultation-imaging',
  imports: [
    TranslatePipe, RouterLink, MatButtonToggleModule, MatSlideToggleModule,
    Icon, VisionViewer, FindingsPanel, AnalysisSteps, AnalysisHistory, FindingLabelPipe,
  ],
  providers: VISION_PROVIDERS,
  templateUrl: './consultation-imaging.html',
  styleUrls: ['../../views/ai-page.css', '../../views/vision-layout.css', './consultation-imaging.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsultationImaging {
  readonly petId = input.required<number>();
  readonly consultationId = input.required<number>();
  /** Consulta cerrada: solo se ven los estudios, no se suben nuevos. */
  readonly readonly = input(false);

  protected readonly store = inject(VisionStore);
  protected readonly ImageType = ImageType;

  protected readonly imageType = signal<ImageType>(ImageType.Skin);
  protected readonly picked = signal<PickedImage | null>(null);
  protected readonly pointer = signal(true);
  private readonly urls: string[] = [];

  protected readonly viewerType = computed(() => this.store.current()?.imageType ?? this.imageType());
  protected readonly viewerSrc = computed(() => {
    const current = this.store.current();
    if (current && !this.picked()) return this.store.images()[current.id] ?? null;
    return this.picked()?.url ?? null;
  });
  protected readonly caption = computed(() => captionOf(this.picked()));
  protected readonly canAnalyze = computed(
    () => !this.readonly() && !!this.picked() && !this.store.processing() && !this.store.current(),
  );
  /** Estudios de esta consulta (el historial trae todos los de la mascota). */
  protected readonly studies = computed(() =>
    this.store.history().filter((a) => a.consultationId === this.consultationId()),
  );
  /** Otros estudios de la mascota (consultas anteriores o fotos del tutor). */
  protected readonly otherStudies = computed(
    () => this.store.history().length - this.studies().length,
  );

  constructor() {
    // El paciente viene de la consulta: no hace falta cargar la lista de pacientes
    effect(() => {
      const petId = this.petId();
      untracked(() => this.store.selectPet(petId));
    });
    // En una consulta cerrada se abre el último estudio, si hay
    effect(() => {
      const first = this.studies()[0];
      if (this.readonly() && first && !untracked(() => this.store.current())) {
        untracked(() => this.store.show(first));
      }
    });
    inject(DestroyRef).onDestroy(() => this.urls.forEach((u) => URL.revokeObjectURL(u)));
  }

  protected setType(type: ImageType): void {
    this.imageType.set(type);
    if (this.store.current()) this.newStudy();
  }

  protected async onFile(file: File | null | undefined): Promise<void> {
    if (!file || this.readonly()) return;
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
      consultationId: this.consultationId(),
      previewUrl: image.url,
    });
  }

  protected newStudy(): void {
    this.picked.set(null);
    this.store.reset();
  }

  protected open(analysis: VisionAnalysis): void {
    this.picked.set(null);
    this.imageType.set(analysis.imageType);
    this.store.show(analysis);
  }
}
