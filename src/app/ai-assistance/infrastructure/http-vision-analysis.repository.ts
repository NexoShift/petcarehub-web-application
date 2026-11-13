import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RequestVisionAnalysisCommand } from '../domain/model/request-vision-analysis.command';
import { VisionAnalysis } from '../domain/model/vision-analysis.entity';
import { VisionAnalysisRepository } from '../domain/repositories/vision-analysis.repository';
import { VisionAnalysisResponse } from './resources/vision-analysis.response';
import { VisionAnalysisAssembler } from './vision-analysis.assembler';
import { absoluteApiUrl } from './api-url';

/** Implementación HTTP del repositorio contra /api/v1/ai/vision-analyses. */
@Injectable()
export class HttpVisionAnalysisRepository extends VisionAnalysisRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/ai/vision-analyses`;

  analyze(command: RequestVisionAnalysisCommand): Observable<VisionAnalysis> {
    // Ojo: NO poner Content-Type a mano. El navegador agrega multipart/form-data con su boundary.
    const form = new FormData();
    form.append('file', command.file, command.file.name);
    form.append('imageType', command.imageType);
    form.append('petId', String(command.petId));
    if (command.consultationId) form.append('consultationId', String(command.consultationId));
    return this.http.post<VisionAnalysisResponse>(this.baseUrl, form).pipe(
      map(VisionAnalysisAssembler.toEntity),
      catchError(err => throwError(() => VisionAnalysisAssembler.toError(err))),
    );
  }

  findById(id: number): Observable<VisionAnalysis> {
    return this.http.get<VisionAnalysisResponse>(`${this.baseUrl}/${id}`).pipe(
      map(VisionAnalysisAssembler.toEntity),
      catchError(err => throwError(() => VisionAnalysisAssembler.toError(err))),
    );
  }

  findByPetId(petId: number): Observable<VisionAnalysis[]> {
    return this.http.get<VisionAnalysisResponse[]>(this.baseUrl, { params: { petId } }).pipe(
      map(list => list.map(VisionAnalysisAssembler.toEntity)),
      map(list => list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())),
      catchError(err => throwError(() => VisionAnalysisAssembler.toError(err))),
    );
  }

  loadImage(analysis: VisionAnalysis): Observable<Blob> {
    return this.http.get(absoluteApiUrl(analysis.imageUrl), { responseType: 'blob' }).pipe(
      catchError(err => throwError(() => VisionAnalysisAssembler.toError(err))),
    );
  }
}
