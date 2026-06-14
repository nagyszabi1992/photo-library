import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  initTranslateTesting,
  translateTestingProviders,
} from '../testing/translate-testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([]), ...translateTestingProviders],
    }).compileComponents();

    initTranslateTesting();
  });

  it('creates the app shell', () => {
    const fixture = TestBed.createComponent(AppComponent);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the title and top-level navigation', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const navigationLinks = Array.from(element.querySelectorAll('nav a'));

    expect(element.querySelector('.main-title')?.textContent).toContain(
      'Photo Library',
    );
    expect(navigationLinks.map((link) => link.textContent?.trim())).toEqual([
      'Photos',
      'Favourites',
    ]);
    expect(navigationLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/',
      '/favourites',
    ]);
    expect(element.querySelectorAll('mat-toolbar').length).toBe(1);
    expect(element.querySelector('router-outlet')).not.toBeNull();
  });
});
