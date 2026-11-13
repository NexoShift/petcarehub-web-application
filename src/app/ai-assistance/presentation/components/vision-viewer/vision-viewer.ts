import { Component, computed, input, output, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../../../shared/presentation/components/icon/icon';
import { ImageType } from '../../../domain/model/image-type';
import { VisionAnalysis } from '../../../domain/model/vision-analysis.entity';
import { FindingLabelPipe } from '../../pipes/finding-label.pipe';

/**
 * Visor de la imagen clínica:
 * - sin imagen: zona para soltar o elegir un archivo;
 * - con foto de piel: dibuja las cajas del modelo encima (posiciones en %, sin canvas);
 * - con radiografía: "modo señalar", un punto que sigue al cursor o al dedo para explicar al dueño;
 * - "Ampliar" lo muestra a pantalla completa.
 */
@Component({
  selector: 'app-vision-viewer',
  imports: [TranslatePipe, Icon, FindingLabelPipe],
  templateUrl: './vision-viewer.html',
  styleUrl: './vision-viewer.css',
  host: { '[class.expanded]': 'expanded()', '(document:keydown.escape)': 'expanded.set(false)' },
})
export class VisionViewer {
  readonly src = input<string | null>(null);
  readonly analysis = input<VisionAnalysis | null>(null);
  readonly imageType = input<ImageType>(ImageType.Skin);
  /** Texto de abajo a la izquierda: "rocky-pata.jpg · 1920×1440". */
  readonly caption = input('');
  readonly processing = input(false);
  /** Muestra el punto para señalar (lo usa el vet con radiografías). */
  readonly pointer = input(false);
  /** Versión baja, para la foto comparativa. */
  readonly compact = input(false);

  /** El usuario soltó un archivo sobre la zona vacía. */
  readonly fileDropped = output<File>();
  /** El usuario hizo clic en la zona vacía. */
  readonly pickRequested = output<void>();

  protected readonly expanded = signal(false);
  protected readonly dragging = signal(false);
  protected readonly pointerAt = signal<{ x: number; y: number } | null>(null);

  protected readonly isRadiograph = computed(() => this.imageType() === ImageType.Radiograph);
  /** Las cajas solo se dibujan cuando la imagen en pantalla es la del análisis. */
  protected readonly boxes = computed(() =>
    (this.analysis()?.locatedFindings ?? []).map(f => ({ finding: f, pos: f.box!.toPercent() })),
  );

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.fileDropped.emit(file);
  }

  protected onPointerMove(event: PointerEvent): void {
    if (!this.pointer()) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.pointerAt.set({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  }
}
