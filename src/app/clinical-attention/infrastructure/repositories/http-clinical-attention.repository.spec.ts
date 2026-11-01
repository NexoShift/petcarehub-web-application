import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { errorInterceptor } from '../../../shared/infrastructure/error.interceptor';
import { BodySystem } from '../../domain/enums/body-system.enum';
import { DiagnosisType } from '../../domain/enums/diagnosis-type.enum';
import { AddClinicalFindingCommand } from '../../domain/model/add-clinical-finding.command';
import { CancelClinicalConsultationCommand } from '../../domain/model/cancel-clinical-consultation.command';
import {
  ClinicalAttentionError,
  ClinicalAttentionErrorCode,
} from '../../domain/model/clinical-attention-error';
import { CreateClinicalConsultationCommand } from '../../domain/model/create-clinical-consultation.command';
import { ReevaluateDiagnosisCommand } from '../../domain/model/reevaluate-diagnosis.command';
import { RegisterAnamnesisCommand } from '../../domain/model/register-anamnesis.command';
import { RegisterDiagnosisCommand } from '../../domain/model/register-diagnosis.command';
import { RegisterPhysiologicalAssessmentCommand } from '../../domain/model/register-physiological-assessment.command';
import { consultationResponse } from '../../testing/clinical-attention.fixtures';
import { HttpClinicalAttentionRepository } from './http-clinical-attention.repository';

const consultationsUrl = `${environment.apiBaseUrl}/clinical-consultations`;

describe('HttpClinicalAttentionRepository', () => {
  let repository: HttpClinicalAttentionRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    repository = TestBed.runInInjectionContext(() => new HttpClinicalAttentionRepository());
  });

  afterEach(() => http.verify());

  async function failWith(promise: Promise<unknown>): Promise<ClinicalAttentionError> {
    try {
      await promise;
    } catch (error) {
      return error as ClinicalAttentionError;
    }
    throw new Error('The request should have failed');
  }

  it('lists the consultations of a pet', async () => {
    const result = repository.findByPetId(20);

    http
      .expectOne(`${environment.apiBaseUrl}/pets/20/clinical-consultations`)
      .flush([consultationResponse({ id: 1 }), consultationResponse({ id: 2 })]);

    expect((await result).map((consultation) => consultation.id)).toEqual([1, 2]);
  });

  it('reads a consultation by id', async () => {
    const result = repository.findById(10);

    const request = http.expectOne(`${consultationsUrl}/10`);
    expect(request.request.method).toBe('GET');
    request.flush(consultationResponse());

    expect((await result).reason).toBe('Control general');
  });

  it('creates a consultation without sending the veterinarian', async () => {
    const result = repository.create(new CreateClinicalConsultationCommand(20, 3, null, 'Control'));

    const request = http.expectOne(consultationsUrl);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      petId: 20,
      clinicId: 3,
      consultingRoomId: null,
      reason: 'Control',
    });
    request.flush(consultationResponse({ status: 'CREATED', startedAt: null }), {
      status: 201,
      statusText: 'Created',
    });

    expect((await result).canStart).toBe(true);
  });

  it('starts a consultation with PUT', async () => {
    const result = repository.start(10);

    const request = http.expectOne(`${consultationsUrl}/10/start`);
    expect(request.request.method).toBe('PUT');
    request.flush(consultationResponse());

    expect((await result).isInProgress).toBe(true);
  });

  it('sends the anamnesis', async () => {
    const result = repository.registerAnamnesis(
      new RegisterAnamnesisCommand(10, {
        chiefComplaint: 'Vomita',
        evolutionTime: '1 día',
        symptoms: ['Vómitos'],
      }),
    );

    const request = http.expectOne(`${consultationsUrl}/10/anamnesis`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      chiefComplaint: 'Vomita',
      evolutionTime: '1 día',
      symptoms: ['Vómitos'],
      diet: null,
      behavior: null,
      previousTreatments: null,
      ownerObservations: null,
    });
    request.flush(consultationResponse(), { status: 201, statusText: 'Created' });
    await result;
  });

  it('sends a physiological assessment', async () => {
    const result = repository.registerPhysiologicalAssessment(
      new RegisterPhysiologicalAssessmentCommand(10, {
        weightKg: 12.4,
        temperatureCelsius: 38.6,
        heartRateBpm: 90,
        respiratoryRateBpm: 24,
      }),
    );

    const request = http.expectOne(`${consultationsUrl}/10/physiological-assessments`);
    expect(request.request.body).toMatchObject({
      weightKg: 12.4,
      temperatureCelsius: 38.6,
      heartRateBpm: 90,
      respiratoryRateBpm: 24,
      bodyConditionScore: null,
    });
    request.flush(consultationResponse(), { status: 201, statusText: 'Created' });
    await result;
  });

  it('sends a clinical finding', async () => {
    const result = repository.addClinicalFinding(
      new AddClinicalFindingCommand(10, BodySystem.Digestive, 'Dolor abdominal', null),
    );

    const request = http.expectOne(`${consultationsUrl}/10/findings`);
    expect(request.request.body).toEqual({
      bodySystem: 'DIGESTIVE',
      description: 'Dolor abdominal',
      severity: null,
    });
    request.flush(consultationResponse(), { status: 201, statusText: 'Created' });
    await result;
  });

  it('sends a diagnosis and its reevaluation to their own routes', async () => {
    const registered = repository.registerDiagnosis(
      new RegisterDiagnosisCommand(
        10,
        { description: 'Gastroenteritis', type: DiagnosisType.Presumptive },
        true,
      ),
    );
    const diagnosisRequest = http.expectOne(`${consultationsUrl}/10/diagnoses`);
    expect(diagnosisRequest.request.body).toMatchObject({ primary: true, type: 'PRESUMPTIVE' });
    diagnosisRequest.flush(consultationResponse(), { status: 201, statusText: 'Created' });
    await registered;

    const reevaluated = repository.reevaluateDiagnosis(
      new ReevaluateDiagnosisCommand(10, 4, {
        description: 'Pancreatitis',
        type: DiagnosisType.Definitive,
      }),
    );
    const reevaluationRequest = http.expectOne(`${consultationsUrl}/10/diagnoses/4/reevaluations`);
    expect(reevaluationRequest.request.method).toBe('POST');
    expect(reevaluationRequest.request.body).not.toHaveProperty('primary');
    reevaluationRequest.flush(consultationResponse(), { status: 201, statusText: 'Created' });
    await reevaluated;
  });

  it('completes and cancels a consultation with PUT', async () => {
    const completed = repository.complete(10);
    const completeRequest = http.expectOne(`${consultationsUrl}/10/complete`);
    expect(completeRequest.request.method).toBe('PUT');
    completeRequest.flush(consultationResponse({ status: 'COMPLETED' }));
    expect((await completed).isClosed).toBe(true);

    const cancelled = repository.cancel(
      new CancelClinicalConsultationCommand(10, 'El tutor se fue'),
    );
    const cancelRequest = http.expectOne(`${consultationsUrl}/10/cancel`);
    expect(cancelRequest.request.method).toBe('PUT');
    expect(cancelRequest.request.body).toEqual({ reason: 'El tutor se fue' });
    cancelRequest.flush(
      consultationResponse({ status: 'CANCELLED', cancellationReason: 'El tutor se fue' }),
    );
    expect((await cancelled).cancellationReason).toBe('El tutor se fue');
  });

  describe('errors', () => {
    it('reports the pending items when completing an incomplete consultation', async () => {
      const result = failWith(repository.complete(10));

      http.expectOne(`${consultationsUrl}/10/complete`).flush(
        {
          status: 409,
          error: 'Conflict',
          message: 'Incomplete consultation',
          path: '/api/v1/clinical-consultations/10/complete',
          timestamp: '2026-10-30T15:00:00Z',
          details: ['anamnesis', 'primaryDiagnosis'],
        },
        { status: 409, statusText: 'Conflict' },
      );

      const error = await result;
      expect(error.code).toBe(ClinicalAttentionErrorCode.IncompleteConsultation);
      expect(error.details).toEqual(['anamnesis', 'primaryDiagnosis']);
    });

    it('says the pet does not exist when creating answers 404', async () => {
      const result = failWith(
        repository.create(new CreateClinicalConsultationCommand(999, 3, null, 'Control')),
      );

      http
        .expectOne(consultationsUrl)
        .flush(
          {
            status: 404,
            error: 'Not Found',
            message: 'Pet not found',
            path: '',
            timestamp: '',
            details: [],
          },
          { status: 404, statusText: 'Not Found' },
        );

      expect((await result).code).toBe(ClinicalAttentionErrorCode.PetNotFound);
    });

    it('says the consultation does not exist when reading answers 404', async () => {
      const result = failWith(repository.findById(999));

      http
        .expectOne(`${consultationsUrl}/999`)
        .flush(
          {
            status: 404,
            error: 'Not Found',
            message: 'Not found',
            path: '',
            timestamp: '',
            details: [],
          },
          { status: 404, statusText: 'Not Found' },
        );

      expect((await result).code).toBe(ClinicalAttentionErrorCode.ConsultationNotFound);
    });

    it('reports a diagnosis conflict', async () => {
      const result = failWith(
        repository.registerDiagnosis(
          new RegisterDiagnosisCommand(
            10,
            { description: 'Otro', type: DiagnosisType.Definitive },
            true,
          ),
        ),
      );

      http
        .expectOne(`${consultationsUrl}/10/diagnoses`)
        .flush(
          {
            status: 409,
            error: 'Conflict',
            message: 'Primary exists',
            path: '',
            timestamp: '',
            details: [],
          },
          { status: 409, statusText: 'Conflict' },
        );

      expect((await result).code).toBe(ClinicalAttentionErrorCode.DiagnosisConflict);
    });

    it('reports a lost connection as an unexpected error', async () => {
      const result = failWith(repository.findById(10));

      http.expectOne(`${consultationsUrl}/10`).error(new ProgressEvent('error'));

      expect((await result).code).toBe(ClinicalAttentionErrorCode.Unexpected);
    });
  });
});
