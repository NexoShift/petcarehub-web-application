import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { ClinicalAttentionRepository } from '../../../domain/repositories/clinical-attention.repository';
import { CLINICAL_ATTENTION_REPOSITORY } from '../../../infrastructure/repositories/clinical-attention.token';
import { consultation } from '../../../testing/clinical-attention.fixtures';
import { ConsultationList } from './consultation-list';

describe('ConsultationList', () => {
  let repository: { [K in keyof ClinicalAttentionRepository]: ReturnType<typeof vi.fn> };
  let fixture: ComponentFixture<ConsultationList>;

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
      ],
    });
  });

  it('searches the consultations of the pet in the link', async () => {
    repository.findByPetId.mockResolvedValue([consultation({ id: 1 }), consultation({ id: 2 })]);
    fixture = TestBed.createComponent(ConsultationList);
    fixture.componentRef.setInput('petId', '20');
    await settle();

    expect(repository.findByPetId).toHaveBeenCalledWith(20);
    expect(html().querySelectorAll('#consultations-table tr[mat-row]')).toHaveLength(2);
    expect(find('#open-consultation-2')).not.toBeNull();
  });

  it('says so when the pet has no consultations', async () => {
    repository.findByPetId.mockResolvedValue([]);
    fixture = TestBed.createComponent(ConsultationList);
    fixture.componentRef.setInput('petId', '20');
    await settle();

    expect(find('#no-consultations')).not.toBeNull();
    expect(find('#consultations-table')).toBeNull();
  });

  it('does not search without a pet number', async () => {
    fixture = TestBed.createComponent(ConsultationList);
    await settle();

    find<HTMLButtonElement>('#search-consultations-button')!.click();
    await settle();

    expect(repository.findByPetId).not.toHaveBeenCalled();
  });
});
