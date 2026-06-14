import { Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import enTranslations from '../assets/i18n/en.json';

export const translateTestingProviders: Provider[] = [
  provideTranslateService({
    lang: 'en',
    fallbackLang: 'en',
  }),
];

export function initTranslateTesting(): void {
  const translateService = TestBed.inject(TranslateService);
  translateService.setTranslation('en', enTranslations, true);
  translateService.use('en');
}
