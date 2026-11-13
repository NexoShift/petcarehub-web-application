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
import { of } from 'rxjs';
import { IamStore } from '../../../../iam/application/iam.store';
import { ProfileApi } from '../../../../profiles/infrastructure/profile-api';

describe('ConsultationNew', () => {
  let repository: { [K in keyof ClinicalAttentionRepository]: ReturnType<typeof vi.fn> };
  let fixture: ComponentFixture<ConsultationNew>;
  let navigate: ReturnType<typeof vi.spyOn>;

  const profileApi = {
    getClinicByAccountId: vi.fn(() => of({ id: 3, name: 'Veterinaria San Martín' })),
    getPatientsByClinicId: vi.fn(() => of([{ id: 20, name: 'Rocky', petCode: 'PET-ROCKY001' }])),
    getConsultingRoomsByClinicId: vi.fn(() => of([
      { id: 7, name: 'Box 1', active: true },
      { id: 8, name: 'Box 2', active: false },
    ])),
  };
  const iamStore = { currentUser: () => ({ id: 1, accountId: 5 }) };

  /** Los mat-select se prueban por el form: la vista solo enlaza los controles. */
  const form = () => (fixture.componentInstance as unknown as {
    form: { controls: Record<string, { value: unknown; setValue(v: unknown): void }> };
  }).form;
  const rooms = () => (fixture.componentInstance as unknown as { rooms(): { id: number }[] }).rooms();

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
        { provide: ProfileApi, useValue: profileApi },
        { provide: IamStore, useValue: iamStore },
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

    expect(form().controls['petId'].value).toBe(20);
  });

  it('takes the clinic from the account and lists only active rooms', () => {
    expect(profileApi.getClinicByAccountId).toHaveBeenCalledWith(5);
    expect(form().controls['clinicId'].value).toBe(3);
    expect(find('.clinic-line')!.textContent).toContain('Veterinaria San Martín');
    expect(rooms().map(r => r.id)).toEqual([7]);
  });

  it('registers the consultation and opens it', async () => {
    repository.create.mockResolvedValue(
      consultation({ id: 33, status: ConsultationStatus.Created, startedAt: null }),
    );

    form().controls['petId'].setValue(20);
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

    form().controls['petId'].setValue(999);
    type('#consultation-reason', 'Control');
    await settle();
    find<HTMLButtonElement>('#create-consultation-button')!.click();
    await settle();

    expect(find('#create-error')!.textContent).toContain('clinicalAttention.errors.petNotFound');
    expect(navigate).not.toHaveBeenCalled();
  });
});
