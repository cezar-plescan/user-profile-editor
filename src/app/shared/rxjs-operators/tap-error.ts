import { HttpErrorResponse } from '@angular/common/http';
import { catchError, EMPTY } from 'rxjs';

/**
 * A custom RxJS operator for handling HTTP errors within an observable stream.
 * It invokes a callback function with the error and a flag indicating if the error was previously caught,
 * then terminates the stream to prevent further processing.
 *
 * @param callback A function that receives the `HttpErrorResponse` and an optional `wasCaught` flag (default: false).
 *                 This callback is where you would typically implement custom error-handling logic,
 *                 such as logging the error, displaying an error message, or performing other side effects.
 *
 * @returns An RxJS operator function (catchError) that catches errors in the stream.
 *          If an error occurs, it invokes the callback and then returns EMPTY to complete the stream.
 */
export function tapError(callback: (error: HttpErrorResponse, wasCaught?: boolean) => void) {
  /**
   * Catches errors emitted by the source observable.
   *
   * @param error The HttpErrorResponse object containing details about the HTTP error.
   * @returns The EMPTY observable, which immediately completes the stream without emitting any values.
   */
  return catchError((error: HttpErrorResponse) => {
    // Retrieve the 'wasCaught' flag from the error object if it exists, otherwise default to 'false'
    const wasCaught = Reflect.get(error, 'wasCaught') || false;

    // Invoke the callback with the error and the 'wasCaught' flag
    callback(error, wasCaught);

    // Returns EMPTY to complete the observable stream.
    // This prevents any further values from being emitted after the error has been handled.
    // This is useful for scenarios where we want to stop processing after an error occurs (e.g., in HTTP requests).
    return EMPTY;
  })
}
