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
 * Constant object containing error messages for display in the UI.
 */
const MESSAGES = {
  INTERNAL_ERROR: 'An internal error has occurred. Please try again later.',
  NO_CONNECTION: 'No network connection. Please try again later.'
}

/**
 * HTTP interceptor function that intercepts and handles HTTP responses and errors.
 *
 * This interceptor focuses on error scenarios, performing the following tasks:
 * 1. Checks if the response is a successful HTTP response (200 OK) with an invalid format.
 * 2. Specifically handles network connection errors, displaying a notification to the user.
 * 3. Skips explicit handling of 400 Bad Request errors, as they are expected to be validation errors
 *    and are typically handled by other mechanisms within the application (e.g., tapValidationErrors operator).
 * 4. Re-throws other HTTP errors to be handled by downstream operators or the global error handler.
 *
 * @param req The intercepted HttpRequest.
 * @param next The HttpHandler to pass the request to.
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
        // Throws a custom HttpResponseBodyFormatError to signal the invalid response format.
        // This error will be caught and handled by the subsequent catchError operator,
        // which will display the appropriate error message to the user.
        throw new HttpResponseBodyFormatError();
      }
    }),
    catchError(error => {
      let errorMessage: string;

      // Handle network connection errors specifically
      if (checkNoNetworkConnection(error)) {
        // Set specific message for network errors
        errorMessage = MESSAGES.NO_CONNECTION;

        // Create a custom network error object
        error = new HttpNoNetworkConnectionError();

        // Mark the error as caught to prevent duplicate handling
        error.wasCaught = true;
      }
      else if (is400ResponseError(error)) {
        // Explicitly skip handling 400 errors here (handled by tapValidationErrors operator)
        // This ensures that validation errors are handled in the component,
        // while other errors (e.g., 5xx, 4xx) fall through to the next case.
        errorMessage = '';
      }
      else {
        // For all other server errors or unexpected errors, display a generic error message.
        errorMessage = MESSAGES.INTERNAL_ERROR
      }

      // Show a Snackbar notification if an error message is available.
      if (errorMessage) {
        snackbar.open(errorMessage);
      }

      // Re-throw the error for handling in the component or a global error handler.
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

/**
 * Checks if the given error is a 400 Bad Request error from the server.
 *
 * @param error The error object to check.
 * @returns True if the error is an HttpErrorResponse with status code 400 (Bad Request), false otherwise.
 */
function is400ResponseError(error: any) {
  return (error instanceof HttpErrorResponse && error.status === HttpStatusCode.BadRequest);
}
