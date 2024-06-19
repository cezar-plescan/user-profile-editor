import { tap } from "rxjs";
import { HttpResponse } from "@angular/common/http";
import { isPlainObject } from "lodash-es";
import { ApiSuccessResponse, HttpClientResponse } from "../types/http-response.type";

/**
 * A custom RxJS operator that taps into an HTTP response observable to extract the data payload.
 * It handles different response types ('body', 'response', 'events') and ensures a successful response format.
 *
 * @template T The type of the data payload expected in the successful response.
 * @param callback A function that is called with the extracted data payload when a successful response is received.
 * @returns An RxJS operator function that can be applied to an observable of HttpEvent<ApiSuccessResponse<T>>, ApiSuccessResponse<T>, or T.
 */
export function tapResponseData<T extends ApiSuccessResponse<any>>(callback: (data: T['data']) => void) {
  return tap((value: HttpClientResponse<T>) => {
    if (isResponseInstance<T>(value as HttpResponse<T>)) {
      callback((value as HttpResponse<T>).body!.data);
    }
    else if (isPlainResponse<T>(value as T)) {
      callback((value as T).data);
    }
  });
}

/**
 * Checks if the emitted value from the HTTP response observable is an instance of `HttpResponse`
 * and contains a successful API response body.
 *
 * This function is specifically designed to handle responses when the `observe` option in `HttpClient`
 * is set to 'response' or 'events', where the response is wrapped in an `HttpEvent` object.
 *
 * @template T The type of the data payload expected in the successful response.
 * @param value The emitted value from the HTTP response observable.
 * @returns `true` if the value is an `HttpResponse` containing a successful response body, otherwise `false`.
 */
function isResponseInstance<T extends ApiSuccessResponse<any>>(value: HttpClientResponse<T>): value is HttpResponse<T> {
  return (value instanceof HttpResponse)
    && isPlainResponse<T>(value.body!)
}

/**
 * Checks if a value is a plain object and represents a successful API response.
 *
 * This function verifies if the value has the correct structure of an `ApiSuccessResponse`,
 * including the `data` property and a `status` of 'ok'.
 *
 * @template T The type of the data payload expected in the successful response.
 * @param response The value to check.
 * @returns `true` if the value is a plain object representing a successful API response, otherwise `false`.
 */
function isPlainResponse<T extends ApiSuccessResponse<any>>(response: HttpClientResponse<T>): response is T {
  return !!response
    && isPlainObject(response)
    && 'data' in response
    && response.status === 'ok'
}
