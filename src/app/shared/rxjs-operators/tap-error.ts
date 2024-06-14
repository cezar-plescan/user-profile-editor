import { HttpErrorResponse } from '@angular/common/http';
import { catchError, EMPTY } from 'rxjs';

/**
 * A custom RxJS operator that taps into the observable stream to handle HTTP errors.
 * It invokes a callback function with the error and then completes the stream,
 * preventing further emissions.
 *
 * @param callback A function to be called when an HTTP error occurs.
 *                 This function receives the HttpErrorResponse object.
 *
 * @returns An RxJS operator function that catches HTTP errors, calls the callback function,
 *          and then returns EMPTY to complete the stream, preventing subsequent values from being emitted.
 */
export function tapError(callback: (error: HttpErrorResponse) => void) {
  /**
   * Catches errors in the observable stream and handles them gracefully.
   */
  return catchError((error: HttpErrorResponse) => {
    // Invoke the callback to handle the error (e.g., log, display message)
    callback(error);

    /**
     * Returns EMPTY to complete the observable stream.
     * This prevents any further values from being emitted after the error has been handled.
     * This is useful for scenarios where we want to stop processing after an error occurs (e.g., in HTTP requests).
     */
    return EMPTY;
  })
}
