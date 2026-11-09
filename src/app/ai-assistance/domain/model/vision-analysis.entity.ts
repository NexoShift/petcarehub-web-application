import { AnalysisStatus, RequesterRole } from './analysis-status';
import { ImageType } from './image-type';
import { VisionFinding } from './vision-finding.entity';

/** Un análisis de visión por computadora ya hecho por el backend. */
export class VisionAnalysis {
  constructor(
    readonly id: number,
    readonly petId: number,
    readonly consultationId: number | null,
    readonly imageType: ImageType,
    readonly status: AnalysisStatus,
    readonly modelId: string | null,
    readonly failureReason: string | null,
    readonly requestedByRole: RequesterRole,
    /** Ruta del backend que devuelve la imagen (se pide como blob, con token). */
    readonly imageUrl: string,
    readonly findings: VisionFinding[],
    readonly createdAt: Date,
  ) {}

  get isSkin(): boolean {
    return this.imageType === ImageType.Skin;
  }

  get isRadiograph(): boolean {
    return this.imageType === ImageType.Radiograph;
  }

  get isCompleted(): boolean {
    return this.status === AnalysisStatus.Completed;
  }

  get hasFindings(): boolean {
    return this.findings.length > 0;
  }

  /** Hallazgos de 50 % o más, ordenados de mayor a menor confianza. */
  get probableFindings(): VisionFinding[] {
    return this.sortedFindings.filter(f => f.probable);
  }

  /** Todos los hallazgos, de mayor a menor confianza (el panel de la radiografía los muestra así). */
  get sortedFindings(): VisionFinding[] {
    return [...this.findings].sort((a, b) => b.confidencePercentage - a.confidencePercentage);
  }

  /** El hallazgo más probable, o null si no hay ninguno. */
  get topFinding(): VisionFinding | null {
    return this.sortedFindings[0] ?? null;
  }

  /** Hallazgos con caja (los que se dibujan encima de la foto de piel). */
  get locatedFindings(): VisionFinding[] {
    return this.findings.filter(f => f.hasLocation);
  }
}
