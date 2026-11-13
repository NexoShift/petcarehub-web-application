import { Pipe, PipeTransform } from '@angular/core';

/**
 * Fecha corta en el idioma actual con Intl (igual que el panel del vet), sin registrar
 * locales de Angular: {{ fecha | localDate: language.locale() }} → "30 oct, 10:32".
 */
@Pipe({ name: 'localDate' })
export class LocalDatePipe implements PipeTransform {
  transform(value: Date | string | null | undefined, locale: string, withTime = true): string {
    if (!value) return '';
    const options: Intl.DateTimeFormatOptions = withTime
      ? { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
      : { day: 'numeric', month: 'short', year: 'numeric' };
    return new Intl.DateTimeFormat(locale, options).format(new Date(value));
  }
}
