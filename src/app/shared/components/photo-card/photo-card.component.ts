import { NgOptimizedImage } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatCard } from '@angular/material/card';
import { TranslatePipe } from '@ngx-translate/core';
import { Photo } from '../../../models/photo.model';

@Component({
  selector: 'app-photo-card',
  imports: [MatCard, NgOptimizedImage, TranslatePipe],
  templateUrl: './photo-card.component.html',
  styleUrl: './photo-card.component.scss',
})
export class PhotoCardComponent {
  readonly photo = input.required<Photo>();
  readonly priority = input<boolean>(false);
}
