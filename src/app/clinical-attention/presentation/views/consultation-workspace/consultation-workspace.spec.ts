import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { ConsultationStatus } from '../../../domain/enums/consultation-status.enum';
import {
  ClinicalAttentionError,
  ClinicalAttentionErrorCode,
} from '../../../domain/model/clinical-attention-error';
import { ClinicalConsultation } from '../../../domain/model/clinical-consultation.entity';
import { ClinicalAttentionRepository } from '../../../domain/repositories/clinical-attention.repository';
import { CLINICAL_ATTENTION_REPOSITORY } from '../../../infrastructure/repositories/clinical-attention.token';
import {
  anamnesis,
  assessment,
  completableConsultation,
  consultation,
  diagnosis,
} from '../../../testing/clinical-attention.fixtures';
import { ConsultationWorkspace } from './consultation-workspace';

describe('ConsultationWorkspace', () => {
  let repository: { [K in keyof ClinicalAttentionRepository]: ReturnType<typeof vi.fn> };
  let fixture: ComponentFixture<ConsultationWorkspace>;

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

  async function render(loaded: ClinicalConsultation): Promise<void> {
    repository.findById.mockResolvedValue(loaded);
    fixture = TestBed.createComponent(ConsultationWorkspace);
    fixture.componentRef.setInput('consultationId', String(loaded.id));
    await settle();
  }

  function type(selector: string, value: string): void {
    const field = find<HTMLInputElement | HTMLTextAreaElement>(selector);
    if (!field) throw new Error(`${selector} is not in the page`);
    field.value = value;
    field.dispatchEvent(new Event('input'));
  }

  beforeEach(() => {
    repository = {
      findByPetId: vi.fn().mockResolvedValue([]),
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
      imports: [ConsultationWorkspace],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: CLINICAL_ATTENTION_REPOSITORY, useValue: repository },
      ],
    });
  });

  it('asks to start a consultation that was only registered', async () => {
    await render(consultation({ status: ConsultationStatus.Created, startedAt: null }));

    expect(find('#start-card')).not.toBeNull();
    expect(find('#phase-anamnesis')).toBeNull();
    expect(find('#anamnesis-form')).toBeNull();
  });

  it('starts the consultation and opens the first phase', async () => {
    await render(consultation({ status: ConsultationStatus.Created, startedAt: null }));
    repository.start.mockResolvedValue(consultation());

    find<HTMLButtonElement>('#start-consultation-button')!.click();
    await settle();

    expect(repository.start).toHaveBeenCalledWith(10);
    expect(find('#start-card')).toBeNull();
    expect(find('#anamnesis-form')).not.toBeNull();
  });

  it('opens the anamnesis phase first and keeps phases 3 and 4 disabled', async () => {
    await render(consultation());

    expect(find('#anamnesis-form')).not.toBeNull();
    expect(find<HTMLButtonElement>('#phase-anamnesis')!.getAttribute('aria-current')).toBe('step');
    expect(find<HTMLButtonElement>('#phase-images')!.disabled).toBe(true);
    expect(find<HTMLButtonElement>('#phase-assistant')!.disabled).toBe(true);
  });

  it('registers the anamnesis and moves on to the assessment', async () => {
    await render(consultation());
    repository.registerAnamnesis.mockResolvedValue(consultation({ anamnesis: anamnesis() }));

    type('#chief-complaint', ' Vomita desde ayer ');
    type('#evolution-time', 'Menos de 24 horas');
    find<HTMLButtonElement>('#suggest-vomiting')!.click();
    await settle();
    find<HTMLButtonElement>('#register-anamnesis-button')!.click();
    await settle();

    expect(repository.registerAnamnesis).toHaveBeenCalledTimes(1);
    const command = repository.registerAnamnesis.mock.calls[0][0];
    expect(command.consultationId).toBe(10);
    expect(command.chiefComplaint).toBe('Vomita desde ayer');
    expect(command.symptoms).toEqual(['clinicalAttention.anamnesis.suggestions.vomiting']);
    expect(find('#assessment-form')).not.toBeNull();
  });

  it('does not send an anamnesis without a chief complaint', async () => {
    await render(consultation());

    find<HTMLButtonElement>('#register-anamnesis-button')!.click();
    await settle();

    expect(repository.registerAnamnesis).not.toHaveBeenCalled();
  });

  it('registers a physiological assessment from the form', async () => {
    await render(consultation({ anamnesis: anamnesis() }));
    repository.registerPhysiologicalAssessment.mockResolvedValue(
      consultation({ anamnesis: anamnesis(), physiologicalAssessments: [assessment()] }),
    );

    type('#weight', '12.4');
    type('#temperature', '38.6');
    type('#heart-rate', '90');
    type('#respiratory-rate', '24');
    await settle();
    find<HTMLButtonElement>('#register-assessment-button')!.click();
    await settle();

    expect(repository.registerPhysiologicalAssessment).toHaveBeenCalledTimes(1);
    const command = repository.registerPhysiologicalAssessment.mock.calls[0][0];
    expect([command.weightKg, command.temperatureCelsius]).toEqual([12.4, 38.6]);
    expect(html().querySelectorAll('#assessment-list li')).toHaveLength(1);
  });

  it('does not send vital signs that are out of range', async () => {
    await render(consultation({ anamnesis: anamnesis() }));

    type('#weight', '12.4');
    type('#temperature', '50');
    type('#heart-rate', '90');
    type('#respiratory-rate', '24');
    await settle();
    find<HTMLButtonElement>('#register-assessment-button')!.click();
    await settle();

    expect(repository.registerPhysiologicalAssessment).not.toHaveBeenCalled();
  });

  it('opens the completion phase when the clinical record is complete', async () => {
    await render(completableConsultation());

    expect(find('#completion-checklist')).not.toBeNull();
    expect(find<HTMLButtonElement>('#complete-consultation-button')!.disabled).toBe(false);
  });

  it('completes the consultation and shows it as a closed record', async () => {
    await render(completableConsultation());
    repository.complete.mockResolvedValue(
      consultation({
        ...completableConsultation(),
        status: ConsultationStatus.Completed,
        completedAt: new Date('2026-10-30T16:00:00Z'),
      }),
    );

    find<HTMLButtonElement>('#complete-consultation-button')!.click();
    await settle();

    expect(repository.complete).toHaveBeenCalledWith(10);
    expect(find('#closed-banner')).not.toBeNull();
    expect(find('#phase-anamnesis')).toBeNull();
  });

  it('lists what is pending when the api refuses to complete', async () => {
    await render(completableConsultation());
    repository.complete.mockRejectedValue(
      new ClinicalAttentionError(ClinicalAttentionErrorCode.IncompleteConsultation, ['anamnesis']),
    );

    find<HTMLButtonElement>('#complete-consultation-button')!.click();
    await settle();

    expect(find('#consultation-error')).not.toBeNull();
    expect(html().querySelectorAll('#pending-items li')).toHaveLength(1);
  });

  it('disables completion while something is pending', async () => {
    await render(
      consultation({ anamnesis: anamnesis(), physiologicalAssessments: [assessment()] }),
    );
    find<HTMLButtonElement>('#phase-completion')!.click();
    await settle();

    expect(find<HTMLButtonElement>('#complete-consultation-button')!.disabled).toBe(true);
    expect(find('#requirement-primaryDiagnosis')!.classList).not.toContain('done');
  });

  it('only offers the primary switch while there is no current primary diagnosis', async () => {
    await render(
      consultation({ anamnesis: anamnesis(), physiologicalAssessments: [assessment()] }),
    );
    find<HTMLButtonElement>('#phase-diagnosis')!.click();
    await settle();

    expect(find('#diagnosis-primary')).not.toBeNull();
    expect(find('#diagnosis-form .meta')).toBeNull();
  });

  it('keeps the diagnosis history and allows reevaluating only the current one', async () => {
    await render(
      consultation({
        anamnesis: anamnesis(),
        physiologicalAssessments: [assessment()],
        diagnoses: [
          diagnosis({ id: 1, status: 'SUPERSEDED' as never }),
          diagnosis({ id: 2, previousDiagnosisId: 1 }),
        ],
      }),
    );
    find<HTMLButtonElement>('#phase-diagnosis')!.click();
    await settle();

    expect(find('#diagnosis-1')).not.toBeNull();
    expect(find('#reevaluate-1')).toBeNull();
    expect(find('#reevaluate-2')).not.toBeNull();
  });

  it('shows a completed consultation read-only', async () => {
    await render(
      consultation({
        ...completableConsultation(),
        status: ConsultationStatus.Completed,
        completedAt: new Date('2026-10-30T16:00:00Z'),
      }),
    );

    expect(find('#closed-banner')).not.toBeNull();
    expect(find('#anamnesis-summary')).not.toBeNull();
    expect(find('#anamnesis-form')).toBeNull();
    expect(find('#assessment-form')).toBeNull();
    expect(find('#finding-form')).toBeNull();
    expect(find('#diagnosis-form')).toBeNull();
    expect(find('#phase-anamnesis')).toBeNull();
  });

  it('shows the reason of a cancelled consultation', async () => {
    await render(
      consultation({
        status: ConsultationStatus.Cancelled,
        cancellationReason: 'El tutor se retiró',
        cancelledAt: new Date('2026-10-30T16:00:00Z'),
      }),
    );

    expect(find('#cancellation-reason')!.textContent).toContain('El tutor se retiró');
    expect(find('#anamnesis-form')).toBeNull();
    expect(find('#no-anamnesis')).not.toBeNull();
  });

  it('shows the error when the consultation cannot be loaded', async () => {
    repository.findById.mockRejectedValue(
      new ClinicalAttentionError(ClinicalAttentionErrorCode.ConsultationNotFound),
    );
    fixture = TestBed.createComponent(ConsultationWorkspace);
    fixture.componentRef.setInput('consultationId', '99');
    await settle();

    expect(find('#load-error')!.textContent).toContain(
      'clinicalAttention.errors.consultationNotFound',
    );
    expect(find('#patient-card')).toBeNull();
  });
});
