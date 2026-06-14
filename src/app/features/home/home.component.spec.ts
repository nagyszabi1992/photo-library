import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { ensureImagePreconnectForTests } from '../../../testing/image-testing';
import {
  initTranslateTesting,
  translateTestingProviders,
} from '../../../testing/translate-testing';
import { Photo } from '../../models/photo.model';
import { FavouritesService } from '../favourites/favourites.service';
import { HomeComponent } from './home.component';
import { PhotoApiService } from './photo-api.service';

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '900px 0px';
  readonly scrollMargin = '0px';
  readonly thresholds = [0];

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);

  constructor(
    private readonly callback: IntersectionObserverCallback,
    private readonly options?: IntersectionObserverInit,
  ) {}

  trigger(entries: Partial<IntersectionObserverEntry>[]): void {
    this.callback(
      entries as IntersectionObserverEntry[],
      this as unknown as IntersectionObserver,
    );
  }

  getObserverOptions(): IntersectionObserverInit | undefined {
    return this.options;
  }
}

describe('HomeComponent', () => {
  const favouriteIds = signal<Set<string>>(new Set());
  const favouritesServiceMock = {
    add: vi.fn<(photo: Photo) => void>(),
    isFavourite: vi.fn((photoId: string) => favouriteIds().has(photoId)),
  };
  const photoApiServiceMock = {
    fetchRandomPhotos: vi.fn(),
  };

  let lastObserver: MockIntersectionObserver | undefined;

  const createPhoto = (overrides: Partial<Photo> = {}): Photo => ({
    id: 'photo-1',
    url: 'https://example.com/photo-1.jpg',
    width: 200,
    height: 300,
    createdAt: 100,
    ...overrides,
  });

  beforeAll(() => {
    Object.defineProperty(globalThis, 'IntersectionObserver', {
      configurable: true,
      writable: true,
      value: class extends MockIntersectionObserver {
        constructor(
          callback: IntersectionObserverCallback,
          options?: IntersectionObserverInit,
        ) {
          super(callback, options);
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          lastObserver = this;
        }
      },
    });
  });

  beforeEach(async () => {
    favouriteIds.set(new Set());
    favouritesServiceMock.add.mockReset();
    favouritesServiceMock.isFavourite.mockClear();
    photoApiServiceMock.fetchRandomPhotos.mockReset();
    lastObserver = undefined;

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        ...translateTestingProviders,
        { provide: FavouritesService, useValue: favouritesServiceMock },
        { provide: PhotoApiService, useValue: photoApiServiceMock },
      ],
    }).compileComponents();

    initTranslateTesting();
    ensureImagePreconnectForTests();
  });

  it('loads the first page on creation and renders the returned photos', () => {
    const response$ = new Subject<Photo[]>();
    photoApiServiceMock.fetchRandomPhotos.mockReturnValue(response$);

    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    expect(photoApiServiceMock.fetchRandomPhotos).toHaveBeenCalledWith(18);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Loading photos...',
    );

    response$.next([
      createPhoto(),
      createPhoto({ id: 'photo-2', url: 'https://example.com/photo-2.jpg' }),
    ]);
    response$.complete();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(element.querySelectorAll('button'));

    expect(buttons).toHaveLength(2);
    expect(buttons[0]?.getAttribute('aria-label')).toBe(
      'Add photo-1 photo to favourites.',
    );
    expect(element.textContent).not.toContain('Loading photos...');
  });

  it('shows an error message when the photo request fails', () => {
    photoApiServiceMock.fetchRandomPhotos.mockReturnValue(
      throwError(() => new Error('network failure')),
    );

    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Failed to load photos. Please try again.',
    );
  });

  it('adds a photo to favourites when the user clicks a card', () => {
    const response$ = new Subject<Photo[]>();
    const photo = createPhoto();
    photoApiServiceMock.fetchRandomPhotos.mockReturnValue(response$);

    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    response$.next([photo]);
    response$.complete();
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector(
      'button',
    ) as HTMLButtonElement;

    button.click();

    expect(favouritesServiceMock.add).toHaveBeenCalledWith(photo);
  });

  it('renders a favourite badge for photos already marked as favourite', () => {
    const response$ = new Subject<Photo[]>();
    const photo = createPhoto();
    favouriteIds.set(new Set([photo.id]));
    photoApiServiceMock.fetchRandomPhotos.mockReturnValue(response$);

    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    response$.next([photo]);
    response$.complete();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.favourite-photo-badge')).not.toBeNull();
    expect(element.textContent).not.toContain('Add to favourites');
  });

  it('starts observing the sentinel and disconnects on destroy', () => {
    const response$ = new Subject<Photo[]>();
    photoApiServiceMock.fetchRandomPhotos.mockReturnValue(response$);

    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    expect(lastObserver?.observe).toHaveBeenCalledTimes(1);
    expect(lastObserver?.getObserverOptions()).toEqual({
      rootMargin: '900px 0px',
    });

    fixture.destroy();

    expect(lastObserver?.disconnect).toHaveBeenCalledTimes(1);
  });

  it('does not start another request while a page is still loading', () => {
    const response$ = new Subject<Photo[]>();
    photoApiServiceMock.fetchRandomPhotos.mockReturnValue(response$);

    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    lastObserver?.trigger([{ isIntersecting: true }]);

    expect(photoApiServiceMock.fetchRandomPhotos).toHaveBeenCalledTimes(1);
  });

  it('queues another page when the sentinel remains visible after a request completes', async () => {
    const firstPage$ = new Subject<Photo[]>();
    const secondPage$ = new Subject<Photo[]>();
    photoApiServiceMock.fetchRandomPhotos
      .mockReturnValue(of([]))
      .mockReturnValueOnce(firstPage$)
      .mockReturnValueOnce(secondPage$);

    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    lastObserver?.trigger([{ isIntersecting: true }]);
    firstPage$.next([createPhoto()]);
    firstPage$.complete();
    await Promise.resolve();

    expect(photoApiServiceMock.fetchRandomPhotos).toHaveBeenCalledTimes(2);

    lastObserver?.trigger([{ isIntersecting: false }]);
    secondPage$.next([createPhoto({ id: 'photo-2' })]);
    secondPage$.complete();
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button').length,
    ).toBe(2);
  });
});
