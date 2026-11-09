import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DashboardStore } from '../../../../shared/application/dashboard.store';
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

/**
 * MW-32 · Análisis visual orientativo (dueño de mascota).
 * El dueño sube o toma una foto de la piel, el modelo marca las zonas y la pantalla da
 * una clasificación orientativa (no es un diagnóstico) con el plazo sugerido para ir al vet.
 * El dueño solo puede subir fotos de piel (SKIN); las radiografías son del veterinario.
 */
/** Análisis visuales por mes mientras no exista Payments. Cambia aquí el máximo. */
const MONTHLY_VISION_LIMIT = 10;
@Component({
  selector: 'app-owner-visual-analysis',
  imports: [
    TranslatePipe,
    RouterLink,
    MatMenuModule,
    MatSnackBarModule,
    MatTooltipModule,
    Icon,
    PetAvatar,
    VisionViewer,
    FindingsPanel,
    AnalysisSteps,
    AnalysisHistory,
  ],
  templateUrl: './owner-visual-analysis.html',
  styleUrls: ['../ai-page.css', '../vision-layout.css'],
})
export class OwnerVisualAnalysis {
  protected readonly store = inject(VisionStore);
  protected readonly dashboard = inject(DashboardStore);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  protected readonly skin = ImageType.Skin;
  /** Foto elegida y todavía no analizada (o la que se analizó, para seguir viéndola). */
  protected readonly picked = signal<PickedImage | null>(null);
  protected readonly comparisonPicked = signal<PickedImage | null>(null);
  private readonly urls: string[] = [];

  /** Lo que se ve en el visor: la foto elegida o la del análisis abierto desde el historial. */
  protected readonly viewerSrc = computed(() => {
    const current = this.store.current();
    if (current && !this.picked()) return this.store.images()[current.id] ?? null;
    return this.picked()?.url ?? null;
  });
  protected readonly caption = computed(() => captionOf(this.picked()));
  /**
   * Cuota "Análisis dérmico e imágenes" del plan (Subscriptions; hoy sale del panel del dueño).
   * Se le suma lo analizado en esta pantalla. Solo se muestra: mientras sea demo no bloquea;
   * el que limita es el backend (429 → aiVision.errors.usageLimit).
   */
  protected readonly usage = computed(() => {
    const now = new Date();
    const used = this.store.history().filter((a) => a.isCompleted && a.createdAt.getFullYear() === now.getFullYear() && a.createdAt.getMonth() === now.getMonth(),).length;
    return { used, limit: MONTHLY_VISION_LIMIT };
  });
  protected readonly canAnalyze = computed(
    () => !!this.picked() && !this.store.processing() && !this.store.current(),
  );
  protected readonly comparisonSrc = computed(() => {
    const c = this.store.comparison();
    return c
      ? (this.store.images()[c.id] ?? this.comparisonPicked()?.url ?? null)
      : (this.comparisonPicked()?.url ?? null);
  });

  constructor() {
    this.store.loadPets(false);
    if (!this.dashboard.owner()) this.dashboard.loadOwner();
    inject(DestroyRef).onDestroy(() => this.urls.forEach((u) => URL.revokeObjectURL(u)));
  }

  protected selectPet(id: number): void {
    this.picked.set(null);
    this.comparisonPicked.set(null);
    this.store.selectPet(id);
  }

  /** Viene de "Elegir de galería", "Usar cámara" o de soltar la foto en el visor. */
  protected async onFile(
    file: File | null | undefined,
    slot: 'main' | 'comparison' = 'main',
  ): Promise<void> {
    if (!file) return;
    try {
      const image = await readPickedImage(file);
      this.urls.push(image.url);
      if (slot === 'main') {
        this.store.reset();
        this.picked.set(image);
      } else {
        this.comparisonPicked.set(image);
        this.store.analyze({
          file: image.file,
          imageType: ImageType.Skin,
          previewUrl: image.url,
          slot: 'comparison',
        });
      }
    } catch (e) {
      this.store.setError(e as VisionError);
    }
  }

  protected fromInput(event: Event, slot: 'main' | 'comparison' = 'main'): void {
    const input = event.target as HTMLInputElement;
    void this.onFile(input.files?.[0], slot);
    input.value = ''; // permite volver a elegir el mismo archivo
  }

  protected analyze(): void {
    const image = this.picked();
    if (!image) return;
    this.store.analyze({ file: image.file, imageType: ImageType.Skin, previewUrl: image.url });
  }

  protected newPhoto(): void {
    this.picked.set(null);
    this.comparisonPicked.set(null);
    this.store.reset();
  }

  protected openFromHistory(analysis: VisionAnalysis): void {
    this.picked.set(null);
    this.comparisonPicked.set(null);
    this.store.show(analysis);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected removeComparison(): void {
    this.comparisonPicked.set(null);
    this.store.clearComparison();
  }

  /** El vet de la mascota ya puede ver el análisis (GET ?petId=): solo se le avisa al dueño. */
  protected share(): void {
    const pet = this.store.selectedPet()?.name ?? '';
    this.snackBar.open(this.translate.instant('aiVision.owner.shared', { pet }), 'OK', {
      duration: 4000,
    });
  }
}
