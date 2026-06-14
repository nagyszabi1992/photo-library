import { TestBed } from '@angular/core/testing';
import { PageHeaderComponent } from './page-header.component';

describe('PageHeaderComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageHeaderComponent],
    }).compileComponents();
  });

  it('renders the title', () => {
    const fixture = TestBed.createComponent(PageHeaderComponent);
    fixture.componentRef.setInput('title', 'Photos');
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent,
    ).toContain('Photos');
  });

  it('renders the subtitle only when one is provided', () => {
    const fixture = TestBed.createComponent(PageHeaderComponent);
    fixture.componentRef.setInput('title', 'Favourites');
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('p'),
    ).toBeNull();

    fixture.componentRef.setInput('subTitle', 'Open a photo to inspect it.');
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Open a photo to inspect it.',
    );
  });
});
