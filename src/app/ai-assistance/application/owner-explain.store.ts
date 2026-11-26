import { Injectable, computed, inject, signal } from '@angular/core';
import { AskOwnerExplanationCommand } from '../domain/model/ask-owner-explanation.command';
import { AssistantError } from '../domain/model/assistant-error';
import { ReferenceConsultation } from '../domain/model/owner-clinical-context';
import { OwnerExplanation } from '../domain/model/owner-explanation.entity';
import { PetOption } from '../domain/model/pet-option';
import { OwnerExplanationRepository } from '../domain/repositories/owner-explanation.repository';
import { PetOptionsApi } from '../infrastructure/pet-options.api';
import { ReferenceConsultationsApi } from '../infrastructure/reference-consultations.api';

/** Pregunta enviada que todavía no tiene respuesta (se ve en el chat con "escribiendo…" o con error). */
export interface PendingQuestion {
  question: string;
  sentAt: Date;
  error: AssistantError | null;
}

/**
 * Estado de "Explicar con IA" (dueño): mascota, consulta de referencia, historial del chat
 * y la pregunta en curso. Se provee en la ruta /ai-explain.
 */
@Injectable()
export class OwnerExplainStore {
  private readonly repository = inject(OwnerExplanationRepository);
  private readonly petsApi = inject(PetOptionsApi);
  private readonly consultationsApi = inject(ReferenceConsultationsApi);

  private readonly _pets = signal<PetOption[]>([]);
  private readonly _petId = signal<number | null>(null);
  private readonly _consultations = signal<ReferenceConsultation[]>([]);
  private readonly _consultationId = signal<number | null>(null);
  private readonly _messages = signal<OwnerExplanation[]>([]);
  private readonly _loading = signal(false);
  private readonly _pending = signal<PendingQuestion | null>(null);
  private readonly _error = signal<AssistantError | null>(null);
  /** Respuestas valoradas en esta sesión (👍/👎). Aún no hay endpoint: queda en memoria. */
  private readonly _feedback = signal<Record<number, 'up' | 'down'>>({});
  /** Preguntas hechas en esta sesión (para el contador de cuota). */
  private readonly _askedNow = signal(0);

  readonly pets = this._pets.asReadonly();
  readonly consultations = this._consultations.asReadonly();
  readonly messages = this._messages.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly pending = this._pending.asReadonly();
  readonly error = this._error.asReadonly();
  readonly feedback = this._feedback.asReadonly();
  readonly askedNow = this._askedNow.asReadonly();

  readonly selectedPet = computed(() => this._pets().find(p => p.id === this._petId()) ?? null);
  readonly consultation = computed(() => this._consultations().find(c => c.id === this._consultationId()) ?? null);
  readonly sending = computed(() => this._pending() !== null && this._pending()!.error === null);

  /** Abre la mascota pedida (?petId) o la primera; y la consulta pedida (?consultationId) o la más nueva. */
  loadPets(preferredPetId?: number | null, preferredConsultationId?: number | null): void {
    this.petsApi.ownerPets().subscribe(pets => {
      this._pets.set(pets);
      const pet = pets.find(p => p.id === preferredPetId) ?? pets[0];
      if (pet) this.selectPet(pet.id, pet.id === preferredPetId ? preferredConsultationId : null);
    });
  }

  selectPet(petId: number, preferredConsultationId?: number | null): void {
    this._petId.set(petId);
    this._messages.set([]);
    this._pending.set(null);
    this._error.set(null);
    this._consultations.set([]);
    this._consultationId.set(null);
    this.consultationsApi.byPet(petId).subscribe(list => {
      if (this._petId() !== petId) return;
      this._consultations.set(list);
      this._consultationId.set((list.find(c => c.id === preferredConsultationId) ?? list[0])?.id ?? null);
    });
    this._loading.set(true);
    this.repository.findByPetId(petId).subscribe({
      next: list => {
        if (this._petId() === petId) this._messages.set(list);
        this._loading.set(false);
      },
      error: (e: AssistantError) => {
        this._error.set(e);
        this._loading.set(false);
      },
    });
  }

  selectConsultation(id: number): void {
    this._consultationId.set(id);
  }

  /** Envía la pregunta. Devuelve false si no pasó la validación (vacía o muy larga). */
  ask(question: string): boolean {
    if (this.sending()) return false;
    let command: AskOwnerExplanationCommand;
    try {
      command = AskOwnerExplanationCommand.create({ petId: this._petId(), consultationId: this._consultationId(), question });
    } catch (e) {
      this._error.set(e as AssistantError);
      return false;
    }
    this._error.set(null);
    this._pending.set({ question: command.question, sentAt: new Date(), error: null });
    this.repository.ask(command).subscribe({
      next: explanation => {
        this._messages.update(list => [...list, explanation]);
        this._pending.set(null);
        this._askedNow.update(n => n + 1);
      },
      error: (e: AssistantError) => this._pending.update(p => (p ? { ...p, error: e } : p)),
    });
    return true;
  }

  /** Vuelve a mandar la pregunta que falló. */
  retry(): void {
    const pending = this._pending();
    if (!pending?.error) return;
    this._pending.set(null);
    this.ask(pending.question);
  }

  discardPending(): void {
    this._pending.set(null);
  }

  rate(explanationId: number, value: 'up' | 'down'): void {
    this._feedback.update(map => ({ ...map, [explanationId]: value }));
  }
}
