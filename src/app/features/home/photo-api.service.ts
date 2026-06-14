import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { Photo } from '../../models/photo.model';

@Injectable({
  providedIn: 'root',
})
export class PhotoApiService {
  private readonly minDelayMs = 200;
  private readonly maxDelayMs = 300;

  fetchRandomPhotos(count: number): Observable<Photo[]> {
    const photos = Array.from({ length: count }, () => {
      const id = uuidv4();

      return {
        id,
        url: `https://picsum.photos/200/300?random=${id}`,
        width: 200,
        height: 300,
        createdAt: Date.now(),
      };
    });

    const delayMs = this.randomInt(this.minDelayMs, this.maxDelayMs);

    return of(photos).pipe(delay(delayMs));
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
