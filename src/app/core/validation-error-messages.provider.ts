import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders, Provider } from "@angular/core";
import { ValidationErrorMessages } from "../shared/types/validation-errors.type";
import { ERROR_MESSAGES_VALUE } from "./validation-error-messages.constant";

// An InjectionToken used to provide and inject error message configuration.
// This allows different parts of the application to customize the error messages.
export const ERROR_MESSAGES = new InjectionToken<ValidationErrorMessages>('Error Messages');

/**
 * Provides the default validation error messages to be used throughout the application.
 * This function is used in the root providers of your application.
 *
 * Returns an array of providers with the default error messages.
 * These providers can be further extended or overridden at the module or component level.
 */
export function provideValidationErrorMessages(): EnvironmentProviders {
  const providers: Provider[] = [
    {
      // Provides the default error messages using the ERROR_MESSAGES token.
      provide: ERROR_MESSAGES,
      useValue: ERROR_MESSAGES_VALUE,
    }
  ];

  // Wraps the providers array in an EnvironmentProviders object.
  // This signals that the providers are intended to be registered at the root level of the application.
  return makeEnvironmentProviders(providers);
}
