import { catchError, EMPTY, OperatorFunction } from "rxjs";
import { HttpErrorResponse, HttpEvent, HttpStatusCode } from "@angular/common/http";

/**
 * A custom RxJS operator that taps into the observable stream to handle HTTP validation errors.
 *
 * @param callback A function to be called when a validation error (HTTP 400 Bad Request) occurs.
 *                 This function receives the HttpErrorResponse object containing the error details.
 *
 * @returns An RxJS operator function that catches validation errors, calls the callback function,
 *          and then completes the stream to prevent further processing.
 */
export function tapValidationErrors<T>(callback: (error: HttpErrorResponse ) => void ): OperatorFunction<HttpEvent<T>, HttpEvent<T>> {
  return catchError((error: HttpErrorResponse | Error) => {
      // Check if the error is an HttpErrorResponse with status code 400 (Bad Request), which is the format defined by the server
      if (error instanceof HttpErrorResponse && error.status === HttpStatusCode.BadRequest) {
        // Invoke the callback to handle the validation error
        callback(error)

        // Return EMPTY to complete the stream and prevent further processing.
        return EMPTY;
      }

      // Re-throw other errors to be handled elsewhere in the observable chain.
      throw error;
    })
}
