import { Component, ElementRef, computed, effect, inject, input, signal, untracked, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DashboardStore } from '../../../../shared/application/dashboard.store';
import { LanguageStore } from '../../../../shared/application/language.store';
import { Icon } from '../../../../shared/presentation/components/icon/icon';
import { PetAvatar } from '../../../../shared/presentation/components/pet-avatar/pet-avatar';
import { IamStore } from '../../../../iam';
import { OwnerExplainStore } from '../../../application/owner-explain.store';
import { MAX_QUESTION_LENGTH } from '../../../domain/model/owner-explanation.entity';
import { LocalDatePipe } from '../../pipes/local-date.pipe';
import { SimpleMarkdownPipe } from '../../pipes/simple-markdown.pipe';

/**
 * Explicar con IA (dueño): chat con el LLM para entender en palabras simples el diagnóstico,
 * las indicaciones y el tratamiento de una consulta de su mascota. No receta ni cambia dosis.
 * A la derecha, la consulta de referencia y la cuota de explicaciones del plan.
 */
@Component({
  selector: 'app-owner-ai-explain',
  imports: [
    TranslatePipe, FormsModule, RouterLink, MatMenuModule, MatTooltipModule,
    Icon, PetAvatar, LocalDatePipe, SimpleMarkdownPipe,
  ],
  templateUrl: './owner-ai-explain.html',
  styleUrls: ['../ai-page.css', './owner-ai-explain.css'],
})
export class OwnerAiExplain {
  /** Query params opcionales (?petId=&consultationId=), p. ej. desde el detalle de una consulta. */
  readonly petId = input<string>();
  readonly consultationId = input<string>();

  protected readonly store = inject(OwnerExplainStore);
  protected readonly dashboard = inject(DashboardStore);
  protected readonly language = inject(LanguageStore);
  private readonly iam = inject(IamStore);
  private readonly translate = inject(TranslateService);

  protected readonly maxQuestion = MAX_QUESTION_LENGTH;
  protected readonly draft = signal('');
  protected readonly copiedId = signal<number | null>(null);
  private readonly thread = viewChild<ElementRef<HTMLElement>>('thread');

  /** Nombre para el saludo: el del panel (Profiles) o la parte del correo. */
  protected readonly ownerName = computed(
    () => this.dashboard.owner()?.ownerFirstName ?? this.iam.currentUser()?.email.split('@')[0] ?? '',
  );
  /** Créditos de IA (LLM) del plan, leídos de Subscriptions al cargar el panel; se suma lo preguntado aquí. */
  protected readonly quota = computed(() => {
    const q = this.dashboard.owner()?.aiQuota;
    const usage = q?.usages.find(u => u.kind === 'llm');
    if (!q || !usage || usage.limit <= 0) return null;
    const used = Math.min(usage.limit, usage.used + this.store.askedNow());
    return { plan: q.plan, renewsInDays: q.renewsInDays, used, limit: usage.limit, left: usage.limit - used, percent: Math.round((used / usage.limit) * 100) };
  });
  protected readonly suggestions = computed(() => {
    const c = this.store.consultation();
    if (!c) return [];
    return c.treatment
      ? ['aiAssistant.owner.suggest.withFood', 'aiAssistant.owner.suggest.howLong', 'aiAssistant.owner.suggest.whatIs']
      : ['aiAssistant.owner.suggest.whatIs', 'aiAssistant.owner.suggest.watch'];
  });

  constructor() {
    effect(() => {
      const petId = Number(this.petId()) || null;
      const consultationId = Number(this.consultationId()) || null;
      untracked(() => this.store.loadPets(petId, consultationId));
    });
    if (!this.dashboard.owner()) this.dashboard.loadOwner();
    // Baja el chat al último mensaje cada vez que llega uno nuevo
    effect(() => {
      this.store.messages();
      this.store.pending();
      untracked(() => queueMicrotask(() => {
        const el = this.thread()?.nativeElement;
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      }));
    });
  }

  protected send(text = this.draft()): void {
    if (this.store.ask(text)) this.draft.set('');
  }

  protected useSuggestion(key: string): void {
    const pet = this.store.selectedPet()?.name ?? '';
    const c = this.store.consultation();
    this.send(this.translate.instant(key, { pet, treatment: c?.treatment?.name ?? '', diagnosis: c?.diagnosis ?? '' }));
  }

  /** Enter envía; Shift+Enter hace salto de línea. */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  protected async copy(id: number, text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.copiedId.set(id);
      setTimeout(() => this.copiedId.set(null), 1500);
    } catch {
      // El navegador no dejó copiar: no pasa nada
    }
  }
}
