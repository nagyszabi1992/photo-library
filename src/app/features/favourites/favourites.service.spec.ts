import { noop } from 'rxjs';
import { Photo } from '../../models/photo.model';
import { FavouritesService } from './favourites.service';

const photoA: Photo = {
  id: 'photo-a',
  url: 'https://example.com/photo-a.jpg',
  width: 200,
  height: 300,
  createdAt: 20,
};

const photoB: Photo = {
  id: 'photo-b',
  url: 'https://example.com/photo-b.jpg',
  width: 400,
  height: 500,
  createdAt: 10,
};

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

function createTransactionRequest<T>(result: T): IDBRequest<T> {
  return { result } as IDBRequest<T>;
}

function createReadwriteTransaction() {
  return {
    objectStore: vi.fn(),
    oncomplete: undefined as (() => void) | null | undefined,
    onerror: undefined as (() => void) | null | undefined,
    error: null as DOMException | null,
  };
}

describe('FavouritesService', () => {
  const originalIndexedDb = globalThis.indexedDB;

  function setIndexedDb(value: IDBFactory | undefined): void {
    if (value === undefined) {
      delete (globalThis as { indexedDB?: IDBFactory }).indexedDB;
      return;
    }

    Object.defineProperty(globalThis, 'indexedDB', {
      configurable: true,
      writable: true,
      value,
    });
  }

  afterEach(() => {
    vi.restoreAllMocks();
    setIndexedDb(originalIndexedDb);
  });

  it('marks itself ready immediately when IndexedDB is unavailable', async () => {
    setIndexedDb(undefined);

    const service = new FavouritesService();
    await flushPromises();

    expect(service.ready()).toBe(true);
    expect(service.favouritePhotos()).toEqual([]);
  });

  it('hydrates favourites from storage and exposes lookup helpers', async () => {
    setIndexedDb({} as IDBFactory);
    const loadAllPhotos = vi
      .spyOn(
        FavouritesService.prototype as unknown as {
          loadAllPhotos: () => Promise<Photo[]>;
        },
        'loadAllPhotos',
      )
      .mockResolvedValue([photoB, photoA]);

    const service = new FavouritesService();
    await flushPromises();

    expect(loadAllPhotos).toHaveBeenCalledTimes(1);
    expect(service.ready()).toBe(true);
    expect(service.favouritePhotos()).toEqual([photoB, photoA]);
    expect(service.getById(photoB.id)).toEqual(photoB);
    expect(service.isFavourite(photoA.id)).toBe(true);
    expect(service.isFavourite('missing')).toBe(false);
  });

  it('logs and recovers when hydration fails', async () => {
    setIndexedDb({} as IDBFactory);
    const error = new Error('Failed to read favourites');
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => noop);

    vi.spyOn(
      FavouritesService.prototype as unknown as {
        loadAllPhotos: () => Promise<Photo[]>;
      },
      'loadAllPhotos',
    ).mockRejectedValue(error);

    const service = new FavouritesService();
    await flushPromises();

    expect(service.ready()).toBe(true);
    expect(service.favouritePhotos()).toEqual([]);
    expect(consoleError).toHaveBeenCalledWith(
      'Failed to load favourite photos from IndexedDB:',
      error,
    );
  });

  it('adds unique photos and ignores duplicates', async () => {
    setIndexedDb(undefined);
    const persistPhoto = vi
      .spyOn(
        FavouritesService.prototype as unknown as {
          persistPhoto: (photo: Photo) => Promise<void>;
        },
        'persistPhoto',
      )
      .mockResolvedValue(undefined);

    const service = new FavouritesService();
    await flushPromises();

    service.add(photoA);
    service.add(photoA);

    expect(service.favouritePhotos()).toEqual([photoA]);
    expect(service.getById(photoA.id)).toEqual(photoA);
    expect(persistPhoto).toHaveBeenCalledTimes(1);
    expect(persistPhoto).toHaveBeenCalledWith(photoA);
  });

  it('removes known photos and ignores unknown ids', async () => {
    setIndexedDb(undefined);
    const deletePhoto = vi
      .spyOn(
        FavouritesService.prototype as unknown as {
          deletePhoto: (photoId: string) => Promise<void>;
        },
        'deletePhoto',
      )
      .mockResolvedValue(undefined);

    const service = new FavouritesService();
    await flushPromises();

    service.add(photoA);
    service.add(photoB);
    service.remove(photoB.id);
    service.remove('missing');

    expect(service.favouritePhotos()).toEqual([photoA]);
    expect(service.isFavourite(photoB.id)).toBe(false);
    expect(deletePhoto).toHaveBeenCalledTimes(1);
    expect(deletePhoto).toHaveBeenCalledWith(photoB.id);
  });

  it('filters invalid records and sorts hydrated photos by creation time', async () => {
    setIndexedDb(undefined);
    const service = new FavouritesService();

    vi.spyOn(
      service as unknown as { getDatabase: () => Promise<IDBDatabase> },
      'getDatabase',
    ).mockResolvedValue({
      transaction: vi.fn().mockReturnValue({
        objectStore: vi.fn().mockReturnValue({
          getAll: () => {
            const request = {
              result: [{ id: 'broken', url: 123 }, photoA, photoB],
            } as IDBRequest<unknown[]>;

            queueMicrotask(() => {
              request.onsuccess?.(new Event('success'));
            });

            return request;
          },
        }),
      }),
    } as unknown as IDBDatabase);

    const loadedPhotos = await (
      service as unknown as { loadAllPhotos: () => Promise<Photo[]> }
    ).loadAllPhotos();

    expect(loadedPhotos).toEqual([photoB, photoA]);
  });

  it('rejects loading when IndexedDB read fails without a native error', async () => {
    setIndexedDb(undefined);
    const service = new FavouritesService();

    vi.spyOn(
      service as unknown as { getDatabase: () => Promise<IDBDatabase> },
      'getDatabase',
    ).mockResolvedValue({
      transaction: vi.fn().mockReturnValue({
        objectStore: vi.fn().mockReturnValue({
          getAll: () => {
            const request = {
              ...createTransactionRequest<unknown[]>([]),
              error: null,
            } as IDBRequest<unknown[]>;

            queueMicrotask(() => {
              request.onerror?.(new Event('error'));
            });

            return request;
          },
        }),
      }),
    } as unknown as IDBDatabase);

    await expect(
      (
        service as unknown as { loadAllPhotos: () => Promise<Photo[]> }
      ).loadAllPhotos(),
    ).rejects.toThrow('Could not read favourites store');
  });

  it('returns early from persistence when IndexedDB is unavailable', async () => {
    setIndexedDb(undefined);
    const service = new FavouritesService();
    const getDatabase = vi.spyOn(
      service as unknown as { getDatabase: () => Promise<IDBDatabase> },
      'getDatabase',
    );

    await (
      service as unknown as { persistPhoto: (photo: Photo) => Promise<void> }
    ).persistPhoto(photoA);

    expect(getDatabase).not.toHaveBeenCalled();
  });

  it('persists a photo through a readwrite transaction', async () => {
    setIndexedDb(undefined);
    const put = vi.fn();
    const transaction = createReadwriteTransaction();
    transaction.objectStore.mockReturnValue({ put });
    const service = new FavouritesService();
    setIndexedDb({} as IDBFactory);

    vi.spyOn(
      service as unknown as { getDatabase: () => Promise<IDBDatabase> },
      'getDatabase',
    ).mockResolvedValue({
      transaction: vi.fn().mockReturnValue(transaction),
    } as unknown as IDBDatabase);

    const persistPromise = (
      service as unknown as { persistPhoto: (photo: Photo) => Promise<void> }
    ).persistPhoto(photoA);

    await flushPromises();
    transaction.oncomplete?.();
    await persistPromise;

    expect(put).toHaveBeenCalledWith(photoA);
  });

  it('logs the fallback persistence error when a transaction fails without a native error', async () => {
    setIndexedDb(undefined);
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => noop);
    const transaction = createReadwriteTransaction();
    transaction.objectStore.mockReturnValue({ put: vi.fn() });
    const service = new FavouritesService();
    setIndexedDb({} as IDBFactory);

    vi.spyOn(
      service as unknown as { getDatabase: () => Promise<IDBDatabase> },
      'getDatabase',
    ).mockResolvedValue({
      transaction: vi.fn().mockReturnValue(transaction),
    } as unknown as IDBDatabase);

    const persistPromise = (
      service as unknown as { persistPhoto: (photo: Photo) => Promise<void> }
    ).persistPhoto(photoA);

    await flushPromises();
    transaction.onerror?.();
    await persistPromise;

    expect(consoleError).toHaveBeenCalledWith(
      'Failed to persist favourite photo:',
      expect.objectContaining({ message: 'Could not save favourite photo' }),
    );
  });

  it('logs persistence errors without rolling back optimistic adds', async () => {
    setIndexedDb({} as IDBFactory);
    const error = new Error('Persist failed');
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => noop);
    const service = new FavouritesService();

    vi.spyOn(
      service as unknown as { getDatabase: () => Promise<IDBDatabase> },
      'getDatabase',
    ).mockRejectedValue(error);

    service.add(photoA);
    await flushPromises();

    expect(service.isFavourite(photoA.id)).toBe(true);
    expect(consoleError).toHaveBeenCalledWith(
      'Failed to persist favourite photo:',
      error,
    );
  });

  it('logs delete errors without restoring removed photos', async () => {
    setIndexedDb({} as IDBFactory);
    const error = new Error('Delete failed');
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => noop);
    const service = new FavouritesService();

    service.add(photoA);
    vi.spyOn(
      service as unknown as { getDatabase: () => Promise<IDBDatabase> },
      'getDatabase',
    ).mockRejectedValue(error);

    service.remove(photoA.id);
    await flushPromises();

    expect(service.isFavourite(photoA.id)).toBe(false);
    expect(consoleError).toHaveBeenCalledWith(
      'Failed to remove favourite photo:',
      error,
    );
  });

  it('returns early from deletion when IndexedDB is unavailable', async () => {
    setIndexedDb(undefined);
    const service = new FavouritesService();
    const getDatabase = vi.spyOn(
      service as unknown as { getDatabase: () => Promise<IDBDatabase> },
      'getDatabase',
    );

    await (
      service as unknown as { deletePhoto: (photoId: string) => Promise<void> }
    ).deletePhoto(photoA.id);

    expect(getDatabase).not.toHaveBeenCalled();
  });

  it('deletes a photo through a readwrite transaction', async () => {
    setIndexedDb(undefined);
    const remove = vi.fn();
    const transaction = createReadwriteTransaction();
    transaction.objectStore.mockReturnValue({ delete: remove });
    const service = new FavouritesService();
    setIndexedDb({} as IDBFactory);

    vi.spyOn(
      service as unknown as { getDatabase: () => Promise<IDBDatabase> },
      'getDatabase',
    ).mockResolvedValue({
      transaction: vi.fn().mockReturnValue(transaction),
    } as unknown as IDBDatabase);

    const deletePromise = (
      service as unknown as { deletePhoto: (photoId: string) => Promise<void> }
    ).deletePhoto(photoA.id);

    await flushPromises();
    transaction.oncomplete?.();
    await deletePromise;

    expect(remove).toHaveBeenCalledWith(photoA.id);
  });

  it('logs the fallback delete error when a transaction fails without a native error', async () => {
    setIndexedDb(undefined);
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => noop);
    const transaction = createReadwriteTransaction();
    transaction.objectStore.mockReturnValue({ delete: vi.fn() });
    const service = new FavouritesService();
    setIndexedDb({} as IDBFactory);

    vi.spyOn(
      service as unknown as { getDatabase: () => Promise<IDBDatabase> },
      'getDatabase',
    ).mockResolvedValue({
      transaction: vi.fn().mockReturnValue(transaction),
    } as unknown as IDBDatabase);

    const deletePromise = (
      service as unknown as { deletePhoto: (photoId: string) => Promise<void> }
    ).deletePhoto(photoA.id);

    await flushPromises();
    transaction.onerror?.();
    await deletePromise;

    expect(consoleError).toHaveBeenCalledWith(
      'Failed to remove favourite photo:',
      expect.objectContaining({ message: 'Could not delete favourite photo' }),
    );
  });

  it('caches the IndexedDB connection and creates the object store on upgrade', async () => {
    const createObjectStore = vi.fn();
    const database = {
      objectStoreNames: {
        contains: vi.fn().mockReturnValue(false),
      },
      createObjectStore,
    } as unknown as IDBDatabase;

    const open = vi.fn().mockImplementation(() => {
      const request = {
        result: database,
      } as IDBOpenDBRequest;

      queueMicrotask(() => {
        request.onupgradeneeded?.(
          new Event('upgradeneeded') as IDBVersionChangeEvent,
        );
        request.onsuccess?.(new Event('success'));
      });

      return request;
    });

    setIndexedDb({ open } as unknown as IDBFactory);
    const service = new FavouritesService();

    const firstDatabase = await (
      service as unknown as { getDatabase: () => Promise<IDBDatabase> }
    ).getDatabase();
    const secondDatabase = await (
      service as unknown as { getDatabase: () => Promise<IDBDatabase> }
    ).getDatabase();

    expect(firstDatabase).toBe(database);
    expect(secondDatabase).toBe(database);
    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith('photo-library-db', 1);
    expect(createObjectStore).toHaveBeenCalledWith('favourites', {
      keyPath: 'id',
    });
  });

  it('skips creating the object store when it already exists', async () => {
    const createObjectStore = vi.fn();
    const database = {
      objectStoreNames: {
        contains: vi.fn().mockReturnValue(true),
      },
      createObjectStore,
    } as unknown as IDBDatabase;

    const open = vi.fn().mockImplementation(() => {
      const request = {
        result: database,
      } as IDBOpenDBRequest;

      queueMicrotask(() => {
        request.onupgradeneeded?.(
          new Event('upgradeneeded') as IDBVersionChangeEvent,
        );
        request.onsuccess?.(new Event('success'));
      });

      return request;
    });

    setIndexedDb({ open } as unknown as IDBFactory);
    const service = new FavouritesService();

    await (
      service as unknown as { getDatabase: () => Promise<IDBDatabase> }
    ).getDatabase();

    expect(createObjectStore).not.toHaveBeenCalled();
  });

  it('rejects opening IndexedDB when the open request fails', async () => {
    const openError = new Error('Open failed');
    const open = vi.fn().mockImplementation(() => {
      const request = {
        error: openError,
      } as IDBOpenDBRequest;

      queueMicrotask(() => {
        request.onerror?.(new Event('error'));
      });

      return request;
    });

    setIndexedDb({ open } as unknown as IDBFactory);
    const service = new FavouritesService();

    await expect(
      (
        service as unknown as { getDatabase: () => Promise<IDBDatabase> }
      ).getDatabase(),
    ).rejects.toBe(openError);
  });

  it('rejects values that are not valid photos', () => {
    setIndexedDb(undefined);
    const service = new FavouritesService();
    const isValidPhoto = service as unknown as {
      isValidPhoto: (candidate: unknown) => boolean;
    };

    expect(isValidPhoto.isValidPhoto(null)).toBe(false);
    expect(isValidPhoto.isValidPhoto('not-an-object')).toBe(false);
    expect(
      isValidPhoto.isValidPhoto({
        id: 'photo-a',
        url: 'https://example.com/photo-a.jpg',
        width: 200,
        height: '300',
        createdAt: 20,
      }),
    ).toBe(false);
    expect(isValidPhoto.isValidPhoto(photoA)).toBe(true);
  });
});
