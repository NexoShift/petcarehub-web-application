import { Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../../../shared/presentation/components/icon/icon';
import { AnalysisPhase } from '../../../application/vision.store';

/** Línea de estado: Pendiente → Procesando → Completado (o Falló). */
@Component({
  selector: 'app-analysis-steps',
  imports: [TranslatePipe, Icon],
  template: `
    <ol>
      @for (step of steps(); track step.key) {
        <li [class]="step.state">
          <span class="mark">
            @switch (step.state) {
              @case ('done') { <app-icon name="check" [size]="12" /> }
              @case ('final') { <app-icon name="check" [size]="12" /> }
              @case ('failed') { <app-icon name="x" [size]="12" /> }
              @default { <span class="pulse"></span> }
            }
          </span>
          {{ step.key | translate }}
        </li>
      }
    </ol>
  `,
  styles: `
    ol { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 4px; margin: 0; padding: 0; list-style: none; }
    li { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px 4px 6px; border-radius: 999px; color: #98A2B3; font-size: 12px; font-weight: 500; }
    .mark { display: grid; place-items: center; width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid currentColor; }
    .pulse { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
    li.done { color: #475467; }
    li.done .mark { border-color: #0BC3BD; background: #0BC3BD; color: #fff; }
    li.current { color: #067A76; background: #E6F9F8; font-weight: 600; }
    li.current .pulse { animation: pulse 1s ease-in-out infinite; }
    li.final { color: #067A76; background: #E6F9F8; font-weight: 600; }
    li.final .mark { border-color: #0BC3BD; background: #0BC3BD; color: #fff; }
    li.failed { color: #B42318; background: #FEF3F2; font-weight: 600; }
    li.failed .mark { background: #D92D20; border-color: #D92D20; color: #fff; }
    @keyframes pulse { 50% { transform: scale(0.4); opacity: 0.4; } }
  `,
})
export class AnalysisSteps {
  readonly phase = input.required<AnalysisPhase>();

  protected readonly steps = computed(() => {
    const phase = this.phase();
    const order: AnalysisPhase[] = ['pending', 'processing', 'completed'];
    const index = phase === 'failed' ? 3 : order.indexOf(phase);
    return [
      { key: 'aiVision.steps.pending', state: index > 0 ? 'done' : 'current' },
      { key: 'aiVision.steps.processing', state: index > 1 ? 'done' : index === 1 ? 'current' : 'todo' },
      {
        key: phase === 'failed' ? 'aiVision.steps.failed' : 'aiVision.steps.completed',
        state: phase === 'failed' ? 'failed' : index === 2 ? 'final' : 'todo',
      },
    ];
  });
}
