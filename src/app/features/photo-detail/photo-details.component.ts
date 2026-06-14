import { DatePipe, NgOptimizedImage } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import {
  MatCard,
  MatCardActions,
  MatCardContent,
} from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs/operators';
import { LoadingIndicatorComponent } from '../../shared/components/loading-indicator/loading-indicator.component';
import { MessageComponent } from '../../shared/components/message/message.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { FavouritesService } from '../favourites/favourites.service';

@Component({
  selector: 'app-photo-details',
  imports: [
    DatePipe,
    MatButton,
    MatIcon,
    MatCard,
    MatCardContent,
    MatCardActions,
    NgOptimizedImage,
    PageHeaderComponent,
    LoadingIndicatorComponent,
    MessageComponent,
    TranslatePipe,
  ],
  templateUrl: './photo-details.component.html',
  styleUrl: './photo-details.component.scss',
})
export class PhotoDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly favouritesService = inject(FavouritesService);

  readonly photoId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: '' },
  );

  readonly ready = this.favouritesService.ready;

  readonly photo = computed(() => {
    const id = this.photoId();
    if (!id) {
      return undefined;
    }
    return this.favouritesService.getById(id);
  });

  removeFromFavourites(): void {
    const photo = this.photo();
    if (!photo) {
      return;
    }
    this.favouritesService.remove(photo.id);
    void this.router.navigate(['/favourites']);
  }
}
