import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageStore } from '../../../../shared/application/language.store';
import { Icon } from '../../../../shared/presentation/components/icon/icon';
import { PetAvatar } from '../../../../shared/presentation/components/pet-avatar/pet-avatar';
import { ClinicalAssistantStore } from '../../../application/clinical-assistant.store';
import { MAX_BACKGROUNDS } from '../../../domain/model/clinical-background';
import { MAX_REASON_LENGTH } from '../../../domain/model/request-clinical-assistance.command';
import { DraftDecision } from '../../../domain/model/soap-draft.entity';
import { LocalDatePipe } from '../../pipes/local-date.pipe';

/**
 * Asistente clínico (vet): genera un borrador SOAP preliminar con el LLM a partir del motivo
 * de la consulta y de los antecedentes marcados (consultas anteriores y análisis de visión).
 * El vet lo acepta, lo edita o lo descarta; al aceptar o editar el backend genera el PDF.
 * Se puede abrir con ?petId=1&consultationId=4 (por ejemplo, desde Imagenología).
 */
@Component({
  selector: 'app-vet-clinical-assistant',
  imports: [
    TranslatePipe, FormsModule, RouterLink, MatSelectModule, MatFormFieldModule, MatInputModule, MatCheckboxModule,
    MatTooltipModule, Icon, PetAvatar, LocalDatePipe,
  ],
  templateUrl: './vet-clinical-assistant.html',
  styleUrls: ['../ai-page.css', './vet-clinical-assistant.css'],
})
export class VetClinicalAssistant {
  readonly petId = input<string>();
  readonly consultationId = input<string>();
  /** true dentro de la fase 4 de la consulta: sin encabezado ni selector (ya se sabe paciente y consulta). */
  readonly embedded = input(false);

  protected readonly store = inject(ClinicalAssistantStore);
  protected readonly language = inject(LanguageStore);
  protected readonly Decision = DraftDecision;
  protected readonly maxReason = MAX_REASON_LENGTH;
  protected readonly maxBackgrounds = MAX_BACKGROUNDS;

  protected readonly reason = signal('');
  protected readonly editing = signal(false);
  protected readonly editedText = signal('');
  protected readonly confirmDiscard = signal(false);
  /** PDF del informe mostrado dentro de la página (object URL del blob). */
  protected readonly pdf = signal<{ raw: string; safe: SafeResourceUrl } | null>(null);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly phase = computed(() => {
    const busy = this.store.busy();
    if (busy === 'generating' || busy === 'regenerating') return 'generating';
    const a = this.store.assistance();
    if (!a) return 'empty';
    return a.confirmedDraft ? 'confirmed' : 'draft';
  });

  constructor() {
    effect(() => {
      const petId = Number(this.petId()) || null;
      const consultationId = Number(this.consultationId()) || null;
      untracked(() => this.store.loadPets(petId, consultationId));
    });
    // Si la consulta ya tenía asistencia, precarga su motivo
    effect(() => {
      const a = this.store.assistance();
      untracked(() => {
        if (a && !this.reason()) this.reason.set(a.currentReason);
        this.editing.set(false);
        this.confirmDiscard.set(false);
        this.pdf.set(null);
      });
    });
  }

  protected selectPet(id: number): void {
    this.reason.set('');
    this.store.selectPet(id);
  }

  protected setConsultation(value: number | string | null): void {
    this.reason.set('');
    this.store.setConsultation(Number(value) || null);
  }

  protected generate(): void {
    this.store.generate(this.reason());
  }

  protected startEdit(): void {
    this.editedText.set(this.store.activeDraft()?.composedText() ?? '');
    this.editing.set(true);
  }

  protected saveEdit(): void {
    this.store.decide(DraftDecision.Edited, this.editedText());
  }

  /** Muestra u oculta el PDF dentro de la página (se pide con el token, por eso no es un enlace directo). */
  protected togglePdf(): void {
    if (this.pdf()) return this.pdf.set(null);
    this.store.openReport(url => this.pdf.set({ raw: url, safe: this.sanitizer.bypassSecurityTrustResourceUrl(url) }));
  }

  protected downloadPdf(): void {
    const consultation = this.store.assistance()?.consultationId ?? '';
    this.store.openReport(url => {
      const a = document.createElement('a');
      a.href = url;
      a.download = `informe-consulta-${consultation}.pdf`;
      a.click();
    });
  }
}
