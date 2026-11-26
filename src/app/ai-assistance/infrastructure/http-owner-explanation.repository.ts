import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AskOwnerExplanationCommand } from '../domain/model/ask-owner-explanation.command';
import { OwnerExplanation } from '../domain/model/owner-explanation.entity';
import { OwnerExplanationRepository } from '../domain/repositories/owner-explanation.repository';
import { AssistantAssembler } from './assistant.assembler';
import { OwnerExplanationResponse } from './resources/clinical-assistance.response';

/** Implementación HTTP contra /ai/owner-explanations (solo ROLE_PET_OWNER y sus mascotas). */
@Injectable()
export class HttpOwnerExplanationRepository extends OwnerExplanationRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/ai/owner-explanations`;

  ask(command: AskOwnerExplanationCommand): Observable<OwnerExplanation> {
    const body = { petId: command.petId, consultationId: command.consultationId, question: command.question };
    return this.http.post<OwnerExplanationResponse>(this.baseUrl, body).pipe(
      map(AssistantAssembler.toExplanation),
      catchError(err => throwError(() => AssistantAssembler.toError(err))),
    );
  }

  findByPetId(petId: number): Observable<OwnerExplanation[]> {
    return this.http.get<OwnerExplanationResponse[]>(this.baseUrl, { params: { petId } }).pipe(
      map(list => list.map(AssistantAssembler.toExplanation)),
      map(list => list.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())),
      catchError(err => throwError(() => AssistantAssembler.toError(err))),
    );
  }
}
