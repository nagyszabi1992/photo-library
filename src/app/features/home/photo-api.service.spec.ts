import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { Photo } from '../../models/photo.model';
import { PhotoApiService } from './photo-api.service';

describe('PhotoApiService', () => {
  let service: PhotoApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PhotoApiService);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useFakeTimers();
    vi.restoreAllMocks();
  });

  it('generates the requested number of photos with stable metadata', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    vi.spyOn(Date, 'now').mockReturnValue(123456789);

    const photosPromise = firstValueFrom(service.fetchRandomPhotos(3));

    await vi.advanceTimersByTimeAsync(200);

    const photos = await photosPromise;

    expect(photos).toHaveLength(3);
    const photosSet = new Set(photos.map((photos) => photos.id));
    expect(photosSet.size).toBe(3);
    photos.every((photo) => {
      expect(photo.width).toBe(200);
      expect(photo.height).toBe(300);
      expect(photo.createdAt).toBe(123456789);
      expect(photo.url).toBe(
        `https://picsum.photos/200/300?random=${photo.id}`,
      );
    });
  });

  it('does not emit before the minimum delay elapses', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    let emitted = false;
    service.fetchRandomPhotos(1).subscribe(() => {
      emitted = true;
    });

    await vi.advanceTimersByTimeAsync(199);
    expect(emitted).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(emitted).toBe(true);
  });

  it('waits the maximum delay when the random delay is highest', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999999);

    let emitted = false;
    service.fetchRandomPhotos(1).subscribe(() => {
      emitted = true;
    });

    await vi.advanceTimersByTimeAsync(299);
    expect(emitted).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(emitted).toBe(true);
  });

  it('returns an empty array when zero photos are requested', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const photosPromise = firstValueFrom(service.fetchRandomPhotos(0));

    await vi.advanceTimersByTimeAsync(200);
    expect(await photosPromise).toEqual([] as Photo[]);
  });
});
