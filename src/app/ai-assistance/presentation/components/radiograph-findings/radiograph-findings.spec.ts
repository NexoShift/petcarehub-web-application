import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { AnalysisStatus, RequesterRole } from '../../../domain/model/analysis-status';
import { ImageType } from '../../../domain/model/image-type';
import { VisionAnalysis } from '../../../domain/model/vision-analysis.entity';
import { VisionFinding } from '../../../domain/model/vision-finding.entity';
import { RadiographFindings } from './radiograph-findings';

const xray = (labels: [string, number][]) =>
  new VisionAnalysis(1, 1, 4, ImageType.Radiograph, AnalysisStatus.Completed, 'petcarehub-radiografias/1', null,
    RequesterRole.Veterinarian, '/img', labels.map(([l, p], i) => new VisionFinding(i + 1, l, p, p >= 50, null)), new Date());

function render(analysis: VisionAnalysis): HTMLElement {
  TestBed.configureTestingModule({ imports: [RadiographFindings], providers: [provideTranslateService()] });
  const fixture = TestBed.createComponent(RadiographFindings);
  fixture.componentRef.setInput('analysis', analysis);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('RadiographFindings', () => {
  it('muestra una fila por hallazgo, ordenada, con porcentaje y lectura', () => {
    const el = render(xray([['pleural_effusion', 41], ['cardiomegaly', 78], ['no_finding', 30]]));
    const rows = Array.from(el.querySelectorAll('tbody tr'));
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('Cardiomegaly');
    expect(rows[0].textContent).toContain('78 %');
    expect(rows[0].classList).toContain('probable');
    expect(rows[1].textContent).toContain('41 %');
    expect(rows[1].classList).not.toContain('probable');
    expect(el.querySelector('[data-testid="xray-normal"]')).toBeNull();
  });

  it('sin hallazgos: aviso en lugar de la tabla', () => {
    const el = render(xray([['no_finding', 88]]));
    expect(el.querySelector('[data-testid="xray-normal"]')).not.toBeNull();
    expect(el.querySelector('table')).toBeNull();
  });

  it('marca las clases poco fiables', () => {
    const el = render(xray([['megaesophagus', 35], ['mass', 25]]));
    expect(el.querySelectorAll('.caution')).toHaveLength(1);
  });
});
