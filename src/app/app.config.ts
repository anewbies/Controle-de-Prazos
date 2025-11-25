import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    // FIX: Use the public API `provideZonelessChangeDetection` instead of the private `NoopNgZone`.
    provideZonelessChangeDetection()
  ]
};
