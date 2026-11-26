import { AssistantError } from './assistant-error';
import { AskOwnerExplanationCommand } from './ask-owner-explanation.command';
import { ClinicalAssistance } from './clinical-assistance.entity';
import { BackgroundType, backgroundKey } from './clinical-background';
import { RequestClinicalAssistanceCommand } from './request-clinical-assistance.command';
import { DraftDecision, SoapDraft } from './soap-draft.entity';

const draft = (id: number, decision = DraftDecision.Pending) =>
  new SoapDraft(id, 's', 'o', 'a', 'p', [], 'gpt', decision, null, null, new Date());

describe('LLM: dominio', () => {
  it('el borrador arma el texto S/O/A/P para editar', () => {
    expect(draft(1).composedText()).toBe('S: s\n\nO: o\n\nA: a\n\nP: p');
  });

  it('la asistencia sabe cuál está confirmado y si se puede regenerar', () => {
    const a = new ClinicalAssistance(1, 4, 1, 9, 'motivo', 'COMPLETED', null, [], [draft(1, DraftDecision.Discarded), draft(2)], new Date());
    expect(a.latestDraft?.id).toBe(2);
    expect(a.canRegenerate).toBe(true);
    const b = new ClinicalAssistance(1, 4, 1, 9, 'motivo', 'COMPLETED', null, [], [draft(1, DraftDecision.Edited)], new Date());
    expect(b.confirmedDraft?.id).toBe(1);
    expect(b.canRegenerate).toBe(false);
  });

  it('el pedido de borrador valida consulta, motivo y máximo de antecedentes', () => {
    const bgs = Array.from({ length: 11 }, (_, i) => ({ type: BackgroundType.PreviousConsultation, referenceId: i + 1 }));
    expect(() => RequestClinicalAssistanceCommand.create({ consultationId: null, petId: 1, currentReason: 'x', backgrounds: [] })).toThrow(AssistantError.MissingConsultation);
    expect(() => RequestClinicalAssistanceCommand.create({ consultationId: 4, petId: 1, currentReason: '  ', backgrounds: [] })).toThrow(AssistantError.MissingReason);
    expect(() => RequestClinicalAssistanceCommand.create({ consultationId: 4, petId: 1, currentReason: 'x', backgrounds: bgs })).toThrow(AssistantError.TooManyBackgrounds);
    expect(RequestClinicalAssistanceCommand.create({ consultationId: 4, petId: 1, currentReason: ' x ', backgrounds: [] }).currentReason).toBe('x');
  });

  it('la pregunta del dueño no puede ir vacía ni pasar de 1000 caracteres', () => {
    expect(() => AskOwnerExplanationCommand.create({ petId: 1, question: ' ' })).toThrow(AssistantError.EmptyQuestion);
    expect(() => AskOwnerExplanationCommand.create({ petId: 1, question: 'a'.repeat(1001) })).toThrow(AssistantError.QuestionTooLong);
    expect(AskOwnerExplanationCommand.create({ petId: 1, question: '¿Qué es?' }).consultationId).toBeNull();
  });

  it('la clave del antecedente distingue el tipo', () => {
    expect(backgroundKey({ type: BackgroundType.VisionAnalysis, referenceId: 4 }))
      .not.toBe(backgroundKey({ type: BackgroundType.PreviousConsultation, referenceId: 4 }));
  });
});
