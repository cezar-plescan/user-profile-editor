import { HttpErrorResponse, HttpEvent, HttpInterceptorFn, HttpResponse, HttpStatusCode } from '@angular/common/http';
import { catchError, tap } from "rxjs";
import { isPlainObject } from "lodash-es";
import { inject } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";

/**
 * Custom error class representing an invalid response body format.
 */
class HttpResponseBodyFormatError extends Error {
  constructor() {
    super('Invalid response body format')
  }
}

/**
 * Custom error class for handling network connection errors (e.g., no internet).
 * Includes a `wasCaught` flag to track whether the error was already handled by the interceptor.
 */
class HttpNoNetworkConnectionError extends Error {
  // Flag to indicate if this error has been handled
  wasCaught = false;

  constructor() {
    super('No network connection');
  }
}

/**
 * HTTP interceptor function that intercepts and validates HTTP responses.
 *
 * It performs the following checks:
 * 1. Verifies if a 200 OK response has a valid format.
 * 2. Detects potential network connection errors.
 * 3. Re-throws other errors for higher-level handling.
 *
 * @param req - The intercepted HttpRequest.
 * @param next - The HttpHandler to pass the request to.
 * @returns An Observable of HttpEvent<any>.
 */
export const serverErrorInterceptor: HttpInterceptorFn = (req, next) => {
  // Inject the MatSnackBar service for displaying error notifications.
  const snackbar = inject(MatSnackBar);

  // Continue handling the request and intercept the response.
  return next(req).pipe(
    tap((httpEvent) => {
      // Checks if the HttpEvent is a successful (200 OK) HttpResponse,
      // but has an invalid response body format.
      if (checkInvalid200Response(httpEvent)) {
        // If the response doesn't match the expected format, notify the user.
        snackbar.open('An internal error has occurred. Please try again later.');

        const error = new HttpResponseBodyFormatError();

        // Log a warning message to the console with details of the error and the invalid response.
        // This can aid in debugging and identifying issues with the backend API.
        console.warn(error)

        // Throws a custom HttpResponseBodyFormatError to signal the invalid response format.
        // This error will be caught and handled by a higher-level error handler in the application,
        // enabling appropriate error recovery or logging mechanisms.
        throw error;
      }
    }),
    catchError(error => {
      // Handle network connection errors specifically
      if (checkNoNetworkConnection(error)) {
        // Show a user-friendly message
        snackbar.open('No network connection. Please try again later.');

        // Create a custom network error
        const error = new HttpNoNetworkConnectionError();

        // Log the error for debugging purposes
        console.warn(error);

        // Mark the error as caught to prevent duplicate handling
        error.wasCaught = true;

        // Re-throw the (modified) network error to allow for potential additional handling
        // in the component or other error handlers further down the line.
        throw error;
      }

      // For all other types of errors (e.g., server errors, timeouts),
      // simply re-throw the error so that it can be handled by a higher-level error handler
      // (e.g., a global error handler or a catchError in the component).
      throw error;
    })
  );
};

/**
 * Helper function to check if an HttpEvent is a successful 200 OK response
 * but with an unexpected body format.
 *
 * @param httpEvent The HttpEvent to be checked.
 * @returns True if it's a 200 OK HttpResponse that fails the body format check, false otherwise.
 */
function checkInvalid200Response(httpEvent: HttpEvent<any>): boolean {
  return (
    // Must be an instance of HttpResponse (i.e., a response, not a request or other event)
    httpEvent instanceof HttpResponse
    // Must have a successful status code (200 OK)
    && httpEvent.status === HttpStatusCode.Ok
    // But the body format must be invalid
    && !check200ResponseBodyFormat(httpEvent)
  )
}

/**
 * Verifies if the response body adheres to the expected format for a successful (200 OK) response.
 * The expected format is a plain object with a 'status' property of 'ok' and a defined 'data' property.
 *
 * @param response The HttpResponse to check.
 * @returns True if the response body matches the expected format, false otherwise.
 */
function check200ResponseBodyFormat(response: HttpResponse<any>): boolean {
  return isPlainObject(response.body)
    && response.body.status === 'ok'
    && response.body.data !== undefined
}

/**
 * Helper function to check if an error is likely due to a network connection issue.
 *
 * @param error The error object to check.
 * @returns `true` if it's likely a network error, `false` otherwise.
 */
function checkNoNetworkConnection(error: any): boolean {
  return(
    error instanceof HttpErrorResponse
    && !error.headers.keys().length
    && !error.ok
    && !error.status
    && !error.error.loaded
    && !error.error.total
  )
}
