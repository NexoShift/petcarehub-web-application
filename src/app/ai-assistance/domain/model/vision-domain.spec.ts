import { AnalysisStatus, RequesterRole } from './analysis-status';
import { BoundingBox } from './bounding-box';
import { ImageType } from './image-type';
import { MAX_IMAGE_BYTES, RequestVisionAnalysisCommand } from './request-vision-analysis.command';
import { VisionAnalysis } from './vision-analysis.entity';
import { VisionError } from './vision-error';
import { VisionFinding } from './vision-finding.entity';
import { orientativeTriage } from '../services/orientative-triage';

const finding = (id: number, pct: number, box: BoundingBox | null = null) =>
  new VisionFinding(id, 'dermatitis', pct, pct >= 50, box);
const analysis = (findings: VisionFinding[], status = AnalysisStatus.Completed, type = ImageType.Skin) =>
  new VisionAnalysis(1, 1, null, type, status, 'm/1', null, RequesterRole.PetOwner, '/img', findings, new Date());
const file = (type: string, size = 1000) => new File([new Uint8Array(size)], 'f', { type });

describe('Visión: dominio', () => {
  it('la caja pasa a porcentaje y se recorta al borde', () => {
    expect(new BoundingBox(0.414, 0.333, 0.172, 0.188).toPercent()).toEqual({ left: 41.4, top: 33.300000000000004, width: 17.2, height: 18.8 });
    const clipped = new BoundingBox(0.9, -0.1, 0.3, 0.5).toPercent();
    expect(clipped.left + clipped.width).toBeLessThanOrEqual(100);
    expect(clipped.top).toBe(0);
  });

  it('ordena los hallazgos y separa los probables', () => {
    const a = analysis([finding(1, 41), finding(2, 82), finding(3, 61)]);
    expect(a.sortedFindings.map(f => f.id)).toEqual([2, 3, 1]);
    expect(a.probableFindings.map(f => f.id)).toEqual([2, 3]);
    expect(a.topFinding?.id).toBe(2);
  });

  it('niveles de confianza: alto, medio y bajo', () => {
    expect(finding(1, 85).confidenceLevel).toBe('high');
    expect(finding(1, 60).confidenceLevel).toBe('medium');
    expect(finding(1, 30).confidenceLevel).toBe('low');
  });

  it('triaje orientativo: sin hallazgos, rutina 48 h y prioritario 24 h', () => {
    expect(orientativeTriage(analysis([]))).toEqual({ level: 'NONE', withinHours: null });
    expect(orientativeTriage(analysis([finding(1, 61)]))).toEqual({ level: 'ROUTINE', withinHours: 48 });
    expect(orientativeTriage(analysis([finding(1, 82)]))).toEqual({ level: 'PRIORITY', withinHours: 24 });
    expect(orientativeTriage(analysis([finding(1, 82)], AnalysisStatus.Failed)).level).toBe('NONE');
  });

  it('el comando valida tipo, tamaño y datos', () => {
    const ok = RequestVisionAnalysisCommand.create({ file: file('image/png'), imageType: ImageType.Skin, petId: 1, consultationId: 0 });
    expect(ok.consultationId).toBeNull();
    expect(() => RequestVisionAnalysisCommand.create({ file: file('text/plain'), imageType: ImageType.Skin, petId: 1 })).toThrow(VisionError.InvalidFile);
    expect(() => RequestVisionAnalysisCommand.create({ file: file('image/jpeg', MAX_IMAGE_BYTES + 1), imageType: ImageType.Skin, petId: 1 })).toThrow(VisionError.TooLarge);
    expect(() => RequestVisionAnalysisCommand.create({ file: null, imageType: ImageType.Skin, petId: 1 })).toThrow(VisionError.MissingData);
  });
});
