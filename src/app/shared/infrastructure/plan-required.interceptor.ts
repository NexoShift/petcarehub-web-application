import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { ApiError } from '../domain/api-error';
import { inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { catchError, throwError } from 'rxjs';

/** Qué le falta a la cuenta según el mensaje del backend (Subscriptions). */
export type PlanProblem = 'noPlan' | 'notIncluded' | 'limit' | 'credits';

export function planProblemOf(status: number, message: unknown): PlanProblem | null {
  const text = typeof message === 'string' ? message : '';
  if (status === 403 && /active subscription is required/i.test(text)) return 'noPlan';
  if (status === 403 && /plan does not include/i.test(text)) return 'notIncluded';
  if (status === 409 && /allowed by the subscription plan/i.test(text)) return 'limit';
  if (status === 409 && /no available credits/i.test(text)) return 'credits';
  return null;
}

/**
 * Cuando el backend responde que falta un plan, que el plan no incluye ese registro, que se
 * llegó al límite del plan o que se acabaron los créditos de IA, muestra un aviso con el botón "Ver planes".
 * El error sigue su camino: cada pantalla mantiene su propio manejo.
 */
export const planRequiredInterceptor: HttpInterceptorFn = (req, next) => {
  // Se resuelven solo cuando hace falta: TranslateService usa HttpClient para cargar los
  // idiomas, y pedirlo aquí al inicio crearía una dependencia circular.
  const injector = inject(Injector);

  return next(req).pipe(
    catchError((err: unknown) => {
      // Llega como ApiError (errorInterceptor va después) o como HttpErrorResponse.
      const status = (err as ApiError | HttpErrorResponse | null)?.status ?? 0;
      const message = err instanceof HttpErrorResponse ? err.error?.message : (err as ApiError | null)?.message;
      const problem = planProblemOf(status, message);
      if (problem) void showPlanNotice(injector, problem);
      return throwError(() => err);
    }),
  );
};

/** El snack bar se carga aparte (import dinámico) para no sumar Material al bundle inicial. */
async function showPlanNotice(injector: Injector, problem: PlanProblem): Promise<void> {
  const { MatSnackBar } = await import('@angular/material/snack-bar');
  const translate = injector.get(TranslateService);
  const router = injector.get(Router);
  injector
    .get(MatSnackBar)
    .open(translate.instant(`plan.notice.${problem}`), translate.instant('plan.notice.action'), { duration: 8000 })
    .onAction()
    .subscribe(() => void router.navigate(['/plan']));
}
