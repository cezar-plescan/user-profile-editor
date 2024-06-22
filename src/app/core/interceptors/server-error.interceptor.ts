import { HttpEvent, HttpInterceptorFn, HttpResponse, HttpStatusCode } from '@angular/common/http';
import { tap } from "rxjs";
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
 * HttpInterceptor function that intercepts and validates the format of successful (200 OK) responses.
 * If the response doesn't match the expected format, it throws an HttpResponseBodyFormatError
 * and displays an error notification to the user.
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
