import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Photo } from '../../models/photo.model';
import { LoadingIndicatorComponent } from '../../shared/components/loading-indicator/loading-indicator.component';
import { MessageComponent } from '../../shared/components/message/message.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PhotoCardComponent } from '../../shared/components/photo-card/photo-card.component';
import { FavouritesService } from '../favourites/favourites.service';
import { PhotoApiService } from './photo-api.service';

@Component({
  selector: 'app-home',
  imports: [
    MatIcon,
    PageHeaderComponent,
    PhotoCardComponent,
    LoadingIndicatorComponent,
    MessageComponent,
    TranslatePipe,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  private readonly photoApiService = inject(PhotoApiService);
  private readonly favouritesService = inject(FavouritesService);
  private readonly translateService = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly sentinel =
    viewChild.required<ElementRef<HTMLDivElement>>('sentinel');

  readonly photos = signal<Photo[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private observer?: IntersectionObserver;
  private readonly pageSize = 18;
  private sentinelVisible = false;

  constructor() {
    this.loadPhotos();
  }

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        this.sentinelVisible = entries.some((entry) => entry.isIntersecting);
        if (this.sentinelVisible) {
          this.loadPhotos();
        }
      },
      { rootMargin: '900px 0px' },
    );

    this.observer.observe(this.sentinel().nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  addToFavourites(photo: Photo): void {
    this.favouritesService.add(photo);
  }

  isFavourite(photoId: string): boolean {
    return this.favouritesService.isFavourite(photoId);
  }

  private loadPhotos(): void {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.photoApiService
      .fetchRandomPhotos(this.pageSize)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((newPhotos) => {
          this.photos.update((existingPhotos) => [
            ...existingPhotos,
            ...newPhotos,
          ]);
          this.loading.set(false);

          if (this.sentinelVisible) {
            queueMicrotask(() => this.loadPhotos());
          }
        }),
        catchError(() => {
          this.error.set(
            this.translateService.instant('home.error.loadingFailed'),
          );
          this.loading.set(false);
          return of([]);
        }),
      )
      .subscribe();
  }
}
