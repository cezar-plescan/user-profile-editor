import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { provideValidationErrorMessages } from "./core/validation-error-messages.provider";
import { serverErrorInterceptor } from "./core/interceptors/server-error.interceptor";

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([serverErrorInterceptor])),
    provideValidationErrorMessages()
  ]
};
