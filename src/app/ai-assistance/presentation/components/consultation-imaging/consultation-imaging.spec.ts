import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { VisionStore } from '../../../application/vision.store';
import { AnalysisStatus, RequesterRole } from '../../../domain/model/analysis-status';
import { ImageType } from '../../../domain/model/image-type';
import { VisionAnalysis } from '../../../domain/model/vision-analysis.entity';
import { VisionFinding } from '../../../domain/model/vision-finding.entity';
import { VisionAnalysisRepository } from '../../../domain/repositories/vision-analysis.repository';
import { ConsultationImaging } from './consultation-imaging';

function analysis(id: number, consultationId: number | null): VisionAnalysis {
  return new VisionAnalysis(
    id, 3, consultationId, ImageType.Skin, AnalysisStatus.Completed, 'piel/1', null,
    RequesterRole.Veterinarian, `/vision-analyses/${id}/image`,
    [new VisionFinding(1, 'dermatitis', 87, true, null)], new Date('2026-11-11T10:00:00'),
  );
}

describe('ConsultationImaging', () => {
  let repository: { [K in keyof VisionAnalysisRepository]: ReturnType<typeof vi.fn> };
  let fixture: ComponentFixture<ConsultationImaging>;
  const find = <T extends HTMLElement>(selector: string): T | null =>
    (fixture.nativeElement as HTMLElement).querySelector<T>(selector);

  async function render(readonly = false): Promise<void> {
    fixture = TestBed.createComponent(ConsultationImaging);
    fixture.componentRef.setInput('petId', 3);
    fixture.componentRef.setInput('consultationId', 8);
    fixture.componentRef.setInput('readonly', readonly);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(() => {
    repository = {
      analyze: vi.fn(),
      findById: vi.fn(),
      // Dos estudios de la consulta 8 y uno de otra consulta
      findByPetId: vi.fn().mockReturnValue(of([analysis(12, 8), analysis(11, 5), analysis(10, 8)])),
      loadImage: vi.fn().mockReturnValue(of(new Blob())),
    };
    TestBed.configureTestingModule({
      imports: [ConsultationImaging],
      providers: [provideRouter([]), provideTranslateService()],
    });
    TestBed.overrideComponent(ConsultationImaging, {
      set: { providers: [VisionStore, { provide: VisionAnalysisRepository, useValue: repository }] },
    });
  });

  it('loads the pet history and lists only the studies of this consultation', async () => {
    await render();

    expect(repository.findByPetId).toHaveBeenCalledWith(3);
    expect(fixture.nativeElement.querySelectorAll('#consultation-studies li').length).toBe(2);
    expect(find('#imaging-analyze')).not.toBeNull();
    expect(find<HTMLButtonElement>('#imaging-analyze')!.disabled).toBe(true);
  });

  it('is read-only for a closed consultation and opens its latest study', async () => {
    await render(true);

    expect(find('#imaging-analyze')).toBeNull();
    expect(find('#imaging-type-skin')).toBeNull();
    expect(repository.loadImage).toHaveBeenCalledWith(expect.objectContaining({ id: 12 }));
    expect(find('#consultation-studies button.active')).not.toBeNull();
  });

  it('shows nothing in a closed consultation that had no images', async () => {
    repository.findByPetId.mockReturnValue(of([analysis(11, 5)]));
    await render(true);

    expect(find('#consultation-imaging')).toBeNull();
    expect(find('#consultation-studies')).toBeNull();
  });

  it('tells the vet the step is optional while there are no images', async () => {
    repository.findByPetId.mockReturnValue(of([]));
    await render();

    expect(find('#imaging-optional')).not.toBeNull();
  });
});
