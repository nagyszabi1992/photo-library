import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Photo } from '../../../models/photo.model';
import { ensureImagePreconnectForTests } from '../../../../testing/image-testing';
import {
  initTranslateTesting,
  translateTestingProviders,
} from '../../../../testing/translate-testing';
import { PhotoCardComponent } from './photo-card.component';

@Component({
  imports: [PhotoCardComponent],
  template: `
    <app-photo-card [photo]="photo" [priority]="priority">
      <span photoCardOverlay>Overlay label</span>
      <span photoCardBadge>Badge label</span>
    </app-photo-card>
  `,
})
class TestHostComponent {
  photo: Photo = {
    id: 'photo-1',
    url: 'https://example.com/photo-1.jpg',
    width: 200,
    height: 300,
    createdAt: 1,
  };
  priority = false;
}

describe('PhotoCardComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [...translateTestingProviders],
    }).compileComponents();

    initTranslateTesting();
    ensureImagePreconnectForTests();
    fixture = TestBed.createComponent(TestHostComponent);
  });

  it('renders photo metadata with lazy loading by default', () => {
    fixture.detectChanges();

    const image = (fixture.nativeElement as HTMLElement).querySelector('img');

    expect(image?.getAttribute('alt')).toBe('Photo photo-1');
    expect(image?.getAttribute('loading')).toBe('lazy');
  });

  it('switches to eager loading and projects overlay content for priority items', () => {
    fixture.componentInstance.priority = true;
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const image = element.querySelector('img');

    expect(image?.getAttribute('loading')).toBe('eager');
    expect(element.textContent).toContain('Overlay label');
    expect(element.textContent).toContain('Badge label');
  });
});
