import { Observable } from 'rxjs';
import { AskOwnerExplanationCommand } from '../model/ask-owner-explanation.command';
import { OwnerExplanation } from '../model/owner-explanation.entity';

/** Puerto de "Explicar con IA" (dueño). Los errores llegan como AssistantError. */
export abstract class OwnerExplanationRepository {
  abstract ask(command: AskOwnerExplanationCommand): Observable<OwnerExplanation>;
  /** Más viejo primero (orden del chat). */
  abstract findByPetId(petId: number): Observable<OwnerExplanation[]>;
}
