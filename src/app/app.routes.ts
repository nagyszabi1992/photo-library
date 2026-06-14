import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'favourites',
    loadComponent: () =>
      import('./features/favourites/favourites.component').then(
        (m) => m.FavouritesComponent,
      ),
  },
  {
    path: 'photos/:id',
    loadComponent: () =>
      import('./features/photo-detail/photo-details.component').then(
        (m) => m.PhotoDetailsComponent,
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
