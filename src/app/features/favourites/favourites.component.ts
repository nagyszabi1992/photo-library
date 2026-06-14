import { Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LoadingIndicatorComponent } from '../../shared/components/loading-indicator/loading-indicator.component';
import { MessageComponent } from '../../shared/components/message/message.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PhotoCardComponent } from '../../shared/components/photo-card/photo-card.component';
import { FavouritesService } from './favourites.service';

@Component({
  selector: 'app-favourites',
  imports: [
    RouterLink,
    MatIcon,
    PageHeaderComponent,
    PhotoCardComponent,
    LoadingIndicatorComponent,
    MessageComponent,
    TranslatePipe,
  ],
  templateUrl: './favourites.component.html',
  styleUrl: './favourites.component.scss',
})
export class FavouritesComponent {
  private readonly favouritesService = inject(FavouritesService);

  readonly ready = this.favouritesService.ready;
  readonly favouritePhotos = this.favouritesService.favouritePhotos;
}
