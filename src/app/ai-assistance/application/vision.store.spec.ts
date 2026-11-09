import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PetOptionsApi } from '../infrastructure/pet-options.api';
import { AnalysisStatus, RequesterRole } from '../domain/model/analysis-status';
import { ImageType } from '../domain/model/image-type';
import { VisionAnalysis } from '../domain/model/vision-analysis.entity';
import { VisionError } from '../domain/model/vision-error';
import { VisionFinding } from '../domain/model/vision-finding.entity';
import { VisionAnalysisRepository } from '../domain/repositories/vision-analysis.repository';
import { VisionStore } from './vision.store';

const done = (id: number) =>
  new VisionAnalysis(
    id,
    1,
    null,
    ImageType.Skin,
    AnalysisStatus.Completed,
    'm',
    null,
    RequesterRole.PetOwner,
    `/img/${id}`,
    [new VisionFinding(1, 'dermatitis', 82, true, null)],
    new Date(),
  );

describe('VisionStore', () => {
  let repository: Record<keyof VisionAnalysisRepository, ReturnType<typeof vi.fn>>;
  let store: VisionStore;

  beforeEach(() => {
    repository = {
      analyze: vi.fn(),
      findById: vi.fn(),
      findByPetId: vi.fn(() => of([])),
      loadImage: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        VisionStore,
        { provide: VisionAnalysisRepository, useValue: repository },
        {
          provide: PetOptionsApi,
          useValue: {
            ownerPets: () =>
              of([{ id: 1, name: 'Rocky', species: 'DOG', breed: 'x', ageYears: 3 }]),
            vetPatients: () => of([]),
          },
        },
      ],
    });
    store = TestBed.inject(VisionStore);
    store.loadPets(false);
  });

  it('elige la primera mascota y trae su historial', () => {
    expect(store.selectedPet()?.name).toBe('Rocky');
    expect(repository.findByPetId).toHaveBeenCalledWith(1);
    expect(store.phase()).toBe('pending');
  });

  it('analiza: guarda el resultado, lo suma al historial y descuenta la cuota', () => {
    repository.analyze.mockReturnValue(of(done(7)));
    const file = new File([new Uint8Array(10)], 'a.jpg', { type: 'image/jpeg' });
    expect(store.analyze({ file, imageType: ImageType.Skin, previewUrl: 'blob:x' })).toBe(true);
    expect(store.current()?.id).toBe(7);
    expect(store.history()[0].id).toBe(7);
    expect(store.images()[7]).toBe('blob:x');
    expect(store.analyzedNow()).toBe(1);
    expect(store.triage()?.level).toBe('PRIORITY');
    expect(store.phase()).toBe('completed');
  });

  it('no llama al backend si el archivo no es válido', () => {
    const file = new File(['x'], 'a.txt', { type: 'text/plain' });
    expect(store.analyze({ file, imageType: ImageType.Skin })).toBe(false);
    expect(repository.analyze).not.toHaveBeenCalled();
    expect(store.error()).toBe(VisionError.InvalidFile);
  });

  it('muestra el error del backend', () => {
    repository.analyze.mockReturnValue(throwError(() => VisionError.Unavailable));
    store.analyze({
      file: new File([new Uint8Array(10)], 'a.png', { type: 'image/png' }),
      imageType: ImageType.Skin,
    });
    expect(store.error()).toBe(VisionError.Unavailable);
    expect(store.processing()).toBeNull();
  });
});
