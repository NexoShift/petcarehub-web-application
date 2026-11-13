import { ImageType } from '../domain/model/image-type';
import { VisionError } from '../domain/model/vision-error';
import { VisionAnalysisAssembler } from './vision-analysis.assembler';

describe('Assemblers (ACL)', () => {
  it('visión: radiografía sin caja y piel con caja', () => {
    const a = VisionAnalysisAssembler.toEntity({
      id: 5, petId: 1, consultationId: null, imageType: 'RADIOGRAPH', status: 'COMPLETED', modelId: 'rx/1', failureReason: null,
      requestedByRole: 'VETERINARIAN', imageUrl: '/api/v1/ai/vision-analyses/5/image', createdAt: '2026-10-30T10:00:00Z',
      findings: [
        { id: 1, label: 'cardiomegalia', confidencePercentage: 78.4, probable: true, hasLocation: false, left: null, top: null, width: null, height: null },
        { id: 2, label: 'dermatitis', confidencePercentage: 82, probable: true, hasLocation: true, left: 0.1, top: 0.2, width: 0.3, height: 0.4 },
      ],
    });
    expect(a.imageType).toBe(ImageType.Radiograph);
    expect(a.findings[0].hasLocation).toBe(false);
    expect(a.findings[0].confidencePercentage).toBe(78);
    expect(a.findings[1].box?.width).toBe(0.3);
  });

  it('status HTTP → errores del dominio', () => {
    expect(VisionAnalysisAssembler.toError({ status: 422 })).toBe(VisionError.NotEvaluable);
    expect(VisionAnalysisAssembler.toError({ status: 413 })).toBe(VisionError.TooLarge);
    expect(VisionAnalysisAssembler.toError({ status: 0 })).toBe(VisionError.Network);
  });
});
