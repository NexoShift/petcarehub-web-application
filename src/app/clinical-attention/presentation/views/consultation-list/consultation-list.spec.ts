import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { ClinicalAttentionRepository } from '../../../domain/repositories/clinical-attention.repository';
import { CLINICAL_ATTENTION_REPOSITORY } from '../../../infrastructure/repositories/clinical-attention.token';
import { consultation } from '../../../testing/clinical-attention.fixtures';
import { ConsultationList } from './consultation-list';
import { of } from 'rxjs';
import { IamStore } from '../../../../iam/application/iam.store';
import { ProfileApi } from '../../../../profiles/infrastructure/profile-api';

describe('ConsultationList', () => {
  let repository: { [K in keyof ClinicalAttentionRepository]: ReturnType<typeof vi.fn> };
  let fixture: ComponentFixture<ConsultationList>;

  const profileApi = {
    getClinicByAccountId: vi.fn(() => of({ id: 3, name: 'Veterinaria San Martín' })),
    getPatientsByClinicId: vi.fn(() => of([
      { id: 20, name: 'Rocky', petCode: 'PET-ROCKY001', species: 'DOG', breed: 'Bulldog', profileImageUrl: null },
      { id: 21, name: 'Luna', petCode: 'PET-LUNA0001', species: 'CAT', breed: null, profileImageUrl: null },
    ])),
  };
  const iamStore = { currentUser: () => ({ id: 1, accountId: 5 }) };

  const html = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const find = <T extends HTMLElement>(selector: string): T | null =>
    html().querySelector<T>(selector);

  async function settle(): Promise<void> {
    for (let round = 0; round < 4; round++) {
      await Promise.resolve();
      fixture.detectChanges();
      await fixture.whenStable();
    }
  }

  beforeEach(() => {
    repository = {
      findByPetId: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      start: vi.fn(),
      registerAnamnesis: vi.fn(),
      registerPhysiologicalAssessment: vi.fn(),
      addClinicalFinding: vi.fn(),
      registerDiagnosis: vi.fn(),
      reevaluateDiagnosis: vi.fn(),
      complete: vi.fn(),
      cancel: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [ConsultationList],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: CLINICAL_ATTENTION_REPOSITORY, useValue: repository },
        { provide: ProfileApi, useValue: profileApi },
        { provide: IamStore, useValue: iamStore },
      ],
    });
  });

  it('searches the consultations of the pet in the link', async () => {
    repository.findByPetId.mockResolvedValue([consultation({ id: 1 }), consultation({ id: 2 })]);
    fixture = TestBed.createComponent(ConsultationList);
    fixture.componentRef.setInput('petId', '20');
    await settle();

    expect(repository.findByPetId).toHaveBeenCalledWith(20);
    expect(html().querySelectorAll('#consultations-list .consultation')).toHaveLength(2);
    expect(find('#open-consultation-2')).not.toBeNull();
  });

  it('says so when the pet has no consultations', async () => {
    repository.findByPetId.mockResolvedValue([]);
    fixture = TestBed.createComponent(ConsultationList);
    fixture.componentRef.setInput('petId', '20');
    await settle();

    expect(find('#no-consultations')).not.toBeNull();
    expect(find('#consultations-list')).toBeNull();
  });

  it('lists the clinic patients and loads the one the vet clicks', async () => {
    repository.findByPetId.mockResolvedValue([consultation({ id: 7 })]);
    fixture = TestBed.createComponent(ConsultationList);
    await settle();

    expect(repository.findByPetId).not.toHaveBeenCalled();
    expect(html().querySelectorAll('.patient')).toHaveLength(2);

    find<HTMLButtonElement>('#patient-21')!.click();
    await settle();

    expect(repository.findByPetId).toHaveBeenCalledWith(21);
    expect(find('#patient-21')!.classList).toContain('active');
    expect(find('#open-consultation-7')).not.toBeNull();
  });
});
