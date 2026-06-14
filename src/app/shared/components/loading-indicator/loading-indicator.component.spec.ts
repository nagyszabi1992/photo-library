import { TestBed } from '@angular/core/testing';
import {
  initTranslateTesting,
  translateTestingProviders,
} from '../../../../testing/translate-testing';
import { LoadingIndicatorComponent } from './loading-indicator.component';

describe('LoadingIndicatorComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingIndicatorComponent],
      providers: [...translateTestingProviders],
    }).compileComponents();

    initTranslateTesting();
  });

  it('renders the default label and spinner state', () => {
    const fixture = TestBed.createComponent(LoadingIndicatorComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Loading...');
    expect(element.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(element.querySelector('mat-progress-spinner')).not.toBeNull();
  });

  it('renders a custom loading label', () => {
    const fixture = TestBed.createComponent(LoadingIndicatorComponent);
    fixture.componentRef.setInput('label', 'Loading favourite photos...');
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Loading favourite photos...',
    );
  });
});
