import { computed, Injectable, signal } from '@angular/core';
import { Photo } from '../../models/photo.model';

@Injectable({
  providedIn: 'root',
})
export class FavouritesService {
  private readonly databaseName = 'photo-library-db';
  private readonly databaseVersion = 1;
  private readonly favouritesStoreName = 'favourites';

  private dbPromise?: Promise<IDBDatabase>;
  private readonly favouritePhotosSignal = signal<Photo[]>([]);

  readonly favouritePhotos = this.favouritePhotosSignal.asReadonly();
  readonly ready = signal(false);

  private readonly photosById = computed(
    () =>
      new Map(
        this.favouritePhotosSignal().map((photo) => [photo.id, photo] as const),
      ),
  );

  private readonly photoIds = computed(
    () => new Set(this.favouritePhotosSignal().map((photo) => photo.id)),
  );

  constructor() {
    void this.hydrateFromDb();
  }

  add(photo: Photo): void {
    const alreadyFavourite = this.photoIds().has(photo.id);

    if (alreadyFavourite) {
      return;
    }

    this.favouritePhotosSignal.update((photos) => [photo, ...photos]);
    void this.persistPhoto(photo);
  }

  remove(photoId: string): void {
    const alreadyFavourite = this.photoIds().has(photoId);

    if (!alreadyFavourite) {
      return;
    }

    this.favouritePhotosSignal.update((photos) =>
      photos.filter((photo) => photo.id !== photoId),
    );
    void this.deletePhoto(photoId);
  }

  getById(photoId: string): Photo | undefined {
    return this.photosById().get(photoId);
  }

  isFavourite(photoId: string): boolean {
    return this.photoIds().has(photoId);
  }

  private async hydrateFromDb(): Promise<void> {
    if (typeof indexedDB === 'undefined') {
      this.ready.set(true);
      return;
    }

    try {
      const favourites = await this.loadAllPhotos();
      this.favouritePhotosSignal.set(favourites);
    } catch (error) {
      console.error('Failed to load favourite photos from IndexedDB:', error);
    } finally {
      this.ready.set(true);
    }
  }

  private async loadAllPhotos(): Promise<Photo[]> {
    const database = await this.getDatabase();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(
        this.favouritesStoreName,
        'readonly',
      );
      const store = transaction.objectStore(this.favouritesStoreName);
      const request = store.getAll();

      request.onsuccess = () => {
        const favourites = (request.result as unknown[])
          .filter((candidate) => this.isValidPhoto(candidate))
          .sort((a, b) => a.createdAt - b.createdAt);
        resolve(favourites);
      };

      request.onerror = () => {
        reject(request.error ?? new Error('Could not read favourites store'));
      };
    });
  }

  private async persistPhoto(photo: Photo): Promise<void> {
    if (typeof indexedDB === 'undefined') {
      return;
    }

    try {
      const database = await this.getDatabase();
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(
          this.favouritesStoreName,
          'readwrite',
        );
        transaction.objectStore(this.favouritesStoreName).put(photo);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () =>
          reject(
            transaction.error ?? new Error('Could not save favourite photo'),
          );
      });
    } catch (error) {
      console.error('Failed to persist favourite photo:', error);
    }
  }

  private async deletePhoto(photoId: string): Promise<void> {
    if (typeof indexedDB === 'undefined') {
      return;
    }

    try {
      const database = await this.getDatabase();
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(
          this.favouritesStoreName,
          'readwrite',
        );
        transaction.objectStore(this.favouritesStoreName).delete(photoId);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () =>
          reject(
            transaction.error ?? new Error('Could not delete favourite photo'),
          );
      });
    } catch (error) {
      console.error('Failed to remove favourite photo:', error);
    }
  }

  private getDatabase(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.databaseName, this.databaseVersion);

      request.onupgradeneeded = () => {
        const database = request.result;

        if (!database.objectStoreNames.contains(this.favouritesStoreName)) {
          database.createObjectStore(this.favouritesStoreName, {
            keyPath: 'id',
          });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
    return this.dbPromise;
  }

  private isValidPhoto(candidate: unknown): candidate is Photo {
    if (typeof candidate !== 'object' || candidate === null) {
      return false;
    }

    const photo = candidate as Photo;

    return (
      typeof photo.id === 'string' &&
      typeof photo.url === 'string' &&
      typeof photo.width === 'number' &&
      typeof photo.height === 'number' &&
      typeof photo.createdAt === 'number'
    );
  }
}
