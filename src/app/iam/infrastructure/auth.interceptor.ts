import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiError } from '../../shared/domain/api-error';
import { TokenStorage } from './token.storage';

/**
 * 1. Añade "Authorization: Bearer <token>" a las peticiones a nuestra API.
 * 2. Si el backend responde 401 (token vencido o inválido), borra el token
 *    y manda al usuario a iniciar sesión.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokens = inject(TokenStorage);
  const router = inject(Router);
  const token = tokens.token();
  const isOurApi = req.url.startsWith(environment.apiBaseUrl);
  const isSignIn = req.url.endsWith('/authentication/sign-in');

  const request = token && isOurApi
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(request).pipe(
    catchError((error: ApiError) => {
      if (error.status === 401 && isOurApi && !isSignIn) {
        tokens.clear();
        router.navigate(['/sign-in']);
      }
      return throwError(() => error);
    }),
  );
};
