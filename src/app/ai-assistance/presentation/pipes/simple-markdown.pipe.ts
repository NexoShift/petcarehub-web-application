import { Pipe, PipeTransform } from '@angular/core';

/**
 * Convierte la respuesta del LLM en HTML simple: párrafos y **negritas**.
 * Primero escapa todo (así nada del texto se interpreta como HTML) y después
 * agrega solo <p>, <br> y <strong>. Se usa con [innerHTML].
 */
@Pipe({ name: 'simpleMarkdown' })
export class SimpleMarkdownPipe implements PipeTransform {
  transform(text: string | null | undefined): string {
    if (!text) return '';
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    return escaped
      .split(/\n{2,}/)
      .map(p => `<p>${p.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}</p>`)
      .join('');
  }
}
