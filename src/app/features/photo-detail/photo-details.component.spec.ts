import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { Photo } from '../../models/photo.model';
import { FavouritesService } from '../favourites/favourites.service';
import { PhotoDetailsComponent } from './photo-details.component';
import {
  initTranslateTesting,
  translateTestingProviders,
} from '../../../testing/translate-testing';
import { ensureImagePreconnectForTests } from '../../../testing/image-testing';

describe('PhotoDetailsComponent', () => {
  const ready = signal(false);
  const paramMap$ = new BehaviorSubject(convertToParamMap({ id: 'photo-1' }));
  const favouritesServiceMock = {
    ready,
    getById: vi.fn<(photoId: string) => Photo | undefined>(),
    remove: vi.fn<(photoId: string) => void>(),
  };
  const routerMock = {
    navigate: vi.fn<Router['navigate']>().mockResolvedValue(true),
  };

  const createPhoto = (overrides: Partial<Photo> = {}): Photo => ({
    id: 'photo-1',
    url: 'https://example.com/photo-1.jpg',
    width: 200,
    height: 300,
    createdAt: new Date('2026-05-01T12:00:00Z').getTime(),
    ...overrides,
  });

  beforeEach(async () => {
    ready.set(false);
    paramMap$.next(convertToParamMap({ id: 'photo-1' }));
    favouritesServiceMock.getById.mockReset();
    favouritesServiceMock.remove.mockReset();
    routerMock.navigate.mockClear();

    await TestBed.configureTestingModule({
      imports: [PhotoDetailsComponent],
      providers: [
        ...translateTestingProviders,
        {
          provide: ActivatedRoute,
          useValue: { paramMap: paramMap$.asObservable() },
        },
        { provide: Router, useValue: routerMock },
        { provide: FavouritesService, useValue: favouritesServiceMock },
      ],
    }).compileComponents();

    initTranslateTesting();
    ensureImagePreconnectForTests();
  });

  it('shows a loading indicator while favourite photos are hydrating', () => {
    const fixture = TestBed.createComponent(PhotoDetailsComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Loading photo details...',
    );
  });

  it('shows an error state when the requested photo is missing', () => {
    ready.set(true);
    favouritesServiceMock.getById.mockReturnValue(undefined);

    const fixture = TestBed.createComponent(PhotoDetailsComponent);
    fixture.detectChanges();

    expect(favouritesServiceMock.getById).toHaveBeenCalledWith('photo-1');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Photo not found.',
    );
  });

  it('does not query favourites when the route id is missing', () => {
    ready.set(true);
    paramMap$.next(convertToParamMap({}));

    const fixture = TestBed.createComponent(PhotoDetailsComponent);
    fixture.detectChanges();

    expect(favouritesServiceMock.getById).not.toHaveBeenCalled();
    expect(fixture.componentInstance.photo()).toBeUndefined();
  });

  it('renders the requested photo details once available', () => {
    ready.set(true);
    favouritesServiceMock.getById.mockReturnValue(createPhoto());

    const fixture = TestBed.createComponent(PhotoDetailsComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const image = element.querySelector('img');

    expect(element.textContent).toContain('Photo ID:');
    expect(element.textContent).toContain('photo-1');
    expect(element.textContent).toContain('Dimensions:');
    expect(element.textContent).toContain('200 x 300');
    expect(element.textContent).toContain('Remove from favourites');
    expect(image?.getAttribute('alt')).toBe('Photo photo-1');
    expect(element.querySelectorAll('button')).toHaveLength(1);
  });

  it('reacts to route id changes by reading the new favourite photo', () => {
    ready.set(true);
    favouritesServiceMock.getById.mockImplementation((photoId: string) =>
      createPhoto({ id: photoId, url: `https://example.com/${photoId}.jpg` }),
    );

    const fixture = TestBed.createComponent(PhotoDetailsComponent);
    fixture.detectChanges();
    paramMap$.next(convertToParamMap({ id: 'photo-2' }));
    fixture.detectChanges();

    expect(favouritesServiceMock.getById).toHaveBeenLastCalledWith('photo-2');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'photo-2',
    );
  });

  it('removes the displayed photo and navigates back to favourites', async () => {
    ready.set(true);
    favouritesServiceMock.getById.mockReturnValue(createPhoto());

    const fixture = TestBed.createComponent(PhotoDetailsComponent);
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector(
      'button',
    ) as HTMLButtonElement;

    button.click();
    await fixture.whenStable();

    expect(favouritesServiceMock.remove).toHaveBeenCalledWith('photo-1');
    expect(routerMock.navigate).toHaveBeenCalledWith(['/favourites']);
  });

  it('does not remove or navigate when no photo is selected', async () => {
    ready.set(true);
    favouritesServiceMock.getById.mockReturnValue(undefined);

    const fixture = TestBed.createComponent(PhotoDetailsComponent);
    fixture.detectChanges();

    fixture.componentInstance.removeFromFavourites();
    await fixture.whenStable();

    expect(favouritesServiceMock.remove).not.toHaveBeenCalled();
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });
});
