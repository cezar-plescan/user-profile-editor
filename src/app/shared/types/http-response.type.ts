import { HttpEvent, HttpResponse } from "@angular/common/http";

/**
 * Represents a successful API response with a standardized structure.
 * @template T The type of the data payload in the response.
 */
export interface ApiSuccessResponse<T> {
  status: 'ok'; // Standard success status
  data: T; // The actual data payload
}

/**
 * Represents a validation error response from the API.
 */
export interface ValidationError {
  field: string; // Name of the field with the error
  message: string; // User-friendly error message
  code: string; // Error code
}

/**
 * Represents the entire validation error response from the API.
 */
export interface ApiValidationErrorResponse {
  message: string; // Overall error message
  errors: ValidationError[]; // Array of individual field errors
}

/**
 * Union type for the possible values emitted by HttpClient observables,
 * depending on the 'observe' option used.
 * @template T The expected type of the response body.
 */
export type HttpClientResponse<T> = HttpEvent<T> | T | HttpResponse<T>
