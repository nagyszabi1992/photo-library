import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ensureImagePreconnectForTests } from '../../../testing/image-testing';
import {
  initTranslateTesting,
  translateTestingProviders,
} from '../../../testing/translate-testing';
import { Photo } from '../../models/photo.model';
import { FavouritesComponent } from './favourites.component';
import { FavouritesService } from './favourites.service';

describe('FavouritesComponent', () => {
  const favouritePhotos = signal<Photo[]>([]);
  const ready = signal(false);
  const favouritesServiceMock = {
    favouritePhotos: favouritePhotos.asReadonly(),
    ready,
  };

  const createPhoto = (overrides: Partial<Photo> = {}): Photo => ({
    id: 'photo-1',
    url: 'https://example.com/photo-1.jpg',
    width: 200,
    height: 300,
    createdAt: 123,
    ...overrides,
  });

  beforeEach(async () => {
    favouritePhotos.set([]);
    ready.set(false);

    await TestBed.configureTestingModule({
      imports: [FavouritesComponent],
      providers: [
        ...translateTestingProviders,
        provideRouter([]),
        { provide: FavouritesService, useValue: favouritesServiceMock },
      ],
    }).compileComponents();

    initTranslateTesting();
    ensureImagePreconnectForTests();
  });

  it('shows a loading indicator while favourites are hydrating', () => {
    const fixture = TestBed.createComponent(FavouritesComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Loading favourite photos...',
    );
  });

  it('shows an empty-state message when no favourites exist', () => {
    ready.set(true);
    const fixture = TestBed.createComponent(FavouritesComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'You have no favourite photos.',
    );
  });

  it('renders favourite photo links when data is available', () => {
    ready.set(true);
    favouritePhotos.set([
      createPhoto(),
      createPhoto({ id: 'photo-2', url: 'https://example.com/photo-2.jpg' }),
    ]);

    const fixture = TestBed.createComponent(FavouritesComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const links = Array.from(element.querySelectorAll('a'));

    expect(links).toHaveLength(2);
    expect(links[0]?.getAttribute('aria-label')).toBe(
      'View photo-1 photo details.',
    );
    expect(links[1]?.getAttribute('aria-label')).toBe(
      'View photo-2 photo details.',
    );
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/photos/photo-1',
      '/photos/photo-2',
    ]);
    expect(element.querySelectorAll('app-photo-card')).toHaveLength(2);
    expect(element.textContent).toContain('View details');
  });
});
