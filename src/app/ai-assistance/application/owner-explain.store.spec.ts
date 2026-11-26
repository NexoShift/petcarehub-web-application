import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AssistantError } from '../domain/model/assistant-error';
import { OwnerExplanation } from '../domain/model/owner-explanation.entity';
import { OwnerExplanationRepository } from '../domain/repositories/owner-explanation.repository';
import { PetOptionsApi } from '../infrastructure/pet-options.api';
import { ReferenceConsultationsApi } from '../infrastructure/reference-consultations.api';
import { OwnerExplainStore } from './owner-explain.store';

describe('OwnerExplainStore', () => {
  let repository: Record<keyof OwnerExplanationRepository, ReturnType<typeof vi.fn>>;
  let store: OwnerExplainStore;

  beforeEach(() => {
    repository = { ask: vi.fn(), findByPetId: vi.fn(() => of([])) };
    TestBed.configureTestingModule({
      providers: [
        OwnerExplainStore,
        { provide: OwnerExplanationRepository, useValue: repository },
        { provide: PetOptionsApi, useValue: { ownerPets: () => of([{ id: 1, name: 'Rocky', species: 'DOG', breed: 'x', ageYears: 3 }]) } },
        { provide: ReferenceConsultationsApi, useValue: { byPet: () => of([{ id: 2, code: '#C', date: '2026-09-12', reason: 'r', diagnosis: 'd', treatment: null, vet: { name: 'v', license: 'l' } }]) } },
      ],
    });
    store = TestBed.inject(OwnerExplainStore);
    store.loadPets();
  });

  it('manda la pregunta con la consulta de referencia y agrega la respuesta', () => {
    repository.ask.mockReturnValue(of(new OwnerExplanation(9, 1, 2, '¿Qué es?', 'Es...', 'gpt', new Date())));
    expect(store.ask('  ¿Qué es?  ')).toBe(true);
    const command = repository.ask.mock.calls[0][0];
    expect(command.question).toBe('¿Qué es?');
    expect(command.consultationId).toBe(2);
    expect(store.messages().length).toBe(1);
    expect(store.pending()).toBeNull();
    expect(store.askedNow()).toBe(1);
  });

  it('si el LLM falla deja la pregunta con error y permite reintentar', () => {
    repository.ask.mockReturnValueOnce(throwError(() => AssistantError.Unavailable));
    store.ask('hola');
    expect(store.pending()?.error).toBe(AssistantError.Unavailable);
    repository.ask.mockReturnValueOnce(of(new OwnerExplanation(1, 1, 2, 'hola', 'ok', null, new Date())));
    store.retry();
    expect(store.pending()).toBeNull();
    expect(store.messages()[0].answer).toBe('ok');
  });

  it('no manda preguntas vacías', () => {
    expect(store.ask('   ')).toBe(false);
    expect(repository.ask).not.toHaveBeenCalled();
    expect(store.error()).toBe(AssistantError.EmptyQuestion);
  });
});
