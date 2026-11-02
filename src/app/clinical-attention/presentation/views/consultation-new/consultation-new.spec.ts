import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { ConsultationStatus } from '../../../domain/enums/consultation-status.enum';
import {
  ClinicalAttentionError,
  ClinicalAttentionErrorCode,
} from '../../../domain/model/clinical-attention-error';
import { ClinicalAttentionRepository } from '../../../domain/repositories/clinical-attention.repository';
import { CLINICAL_ATTENTION_REPOSITORY } from '../../../infrastructure/repositories/clinical-attention.token';
import { consultation } from '../../../testing/clinical-attention.fixtures';
import { ConsultationNew } from './consultation-new';

describe('ConsultationNew', () => {
  let repository: { [K in keyof ClinicalAttentionRepository]: ReturnType<typeof vi.fn> };
  let fixture: ComponentFixture<ConsultationNew>;
  let navigate: ReturnType<typeof vi.spyOn>;

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

  function type(selector: string, value: string): void {
    const field = find<HTMLInputElement | HTMLTextAreaElement>(selector)!;
    field.value = value;
    field.dispatchEvent(new Event('input'));
  }

  beforeEach(async () => {
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
      imports: [ConsultationNew],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: CLINICAL_ATTENTION_REPOSITORY, useValue: repository },
      ],
    });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(ConsultationNew);
    await settle();
  });

  it('prefills the pet from the link', async () => {
    fixture = TestBed.createComponent(ConsultationNew);
    fixture.componentRef.setInput('petId', '20');
    await settle();

    expect(find<HTMLInputElement>('#pet-id')!.value).toBe('20');
  });

  it('registers the consultation and opens it', async () => {
    repository.create.mockResolvedValue(
      consultation({ id: 33, status: ConsultationStatus.Created, startedAt: null }),
    );

    type('#pet-id', '20');
    type('#clinic-id', '3');
    type('#consultation-reason', '  Control general  ');
    await settle();
    find<HTMLButtonElement>('#create-consultation-button')!.click();
    await settle();

    expect(repository.create).toHaveBeenCalledTimes(1);
    const command = repository.create.mock.calls[0][0];
    expect([command.petId, command.clinicId, command.consultingRoomId, command.reason]).toEqual([
      20,
      3,
      null,
      'Control general',
    ]);
    expect(navigate).toHaveBeenCalledWith(['/consultations', 33]);
  });

  it('does not send the form while required fields are empty', async () => {
    find<HTMLButtonElement>('#create-consultation-button')!.click();
    await settle();

    expect(repository.create).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('shows the error when the pet does not exist', async () => {
    repository.create.mockRejectedValue(
      new ClinicalAttentionError(ClinicalAttentionErrorCode.PetNotFound),
    );

    type('#pet-id', '999');
    type('#clinic-id', '3');
    type('#consultation-reason', 'Control');
    await settle();
    find<HTMLButtonElement>('#create-consultation-button')!.click();
    await settle();

    expect(find('#create-error')!.textContent).toContain('clinicalAttention.errors.petNotFound');
    expect(navigate).not.toHaveBeenCalled();
  });
});
