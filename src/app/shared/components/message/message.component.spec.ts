import { TestBed } from '@angular/core/testing';
import {
  initTranslateTesting,
  translateTestingProviders,
} from '../../../../testing/translate-testing';
import { MessageComponent } from './message.component';

describe('MessageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessageComponent],
      providers: [...translateTestingProviders],
    }).compileComponents();

    initTranslateTesting();
  });

  it('renders the provided message with the default info type', () => {
    const fixture = TestBed.createComponent(MessageComponent);
    fixture.componentRef.setInput('message', 'You have no favourite photos.');
    fixture.detectChanges();

    const container = (fixture.nativeElement as HTMLElement).querySelector(
      '.message-container',
    );

    expect(container?.className).toContain('info');
    expect(container?.textContent).toContain('You have no favourite photos.');
  });

  it('applies the error variant when requested', () => {
    const fixture = TestBed.createComponent(MessageComponent);
    fixture.componentRef.setInput('type', 'error');
    fixture.componentRef.setInput('message', 'Something went wrong.');
    fixture.detectChanges();

    const container = (fixture.nativeElement as HTMLElement).querySelector(
      '.message-container',
    );

    expect(container?.className).toContain('error');
    expect(container?.textContent).toContain('Something went wrong.');
  });
});
