import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ApiError } from '../domain/api-error';

/**
 * Convierte cualquier error HTTP en un ApiError, así las vistas
 * siempre reciben la misma forma, venga del backend o de la red.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(catchError((err: HttpErrorResponse) => throwError(() => toApiError(err, req.url))));

function toApiError(err: HttpErrorResponse, url: string): ApiError {
  if (err.error && typeof err.error === 'object' && 'message' in err.error) {
    return err.error as ApiError;
  }
  return {
    status: err.status,
    error: err.statusText,
    // 'errors.network' es una clave de i18n: las vistas muestran los errores con | translate
    message: err.status === 0 ? 'errors.network' : err.message,
    path: url,
    timestamp: new Date().toISOString(),
    details: [],
  };
}
