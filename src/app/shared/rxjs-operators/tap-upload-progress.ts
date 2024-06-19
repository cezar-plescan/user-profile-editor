import { tap } from "rxjs";
import { HttpEvent, HttpEventType } from "@angular/common/http";
import { HttpClientResponse } from "../types/http-response.type";
import { isPlainObject } from "lodash-es";

/**
 * A custom RxJS operator that taps into the HTTP request observable to extract and report upload progress.
 *
 * @param callback A function to be called whenever an upload progress event is received,
 *                 providing the current progress percentage as an argument.
 *
 * @returns An RxJS operator function that taps into the observable stream,
 *          extracts upload progress events, and invokes the provided callback with the calculated progress.
 */
export function tapUploadProgress<T>( callback: ( progress: number ) => void ) {
  /**
   * Tap into the observable stream to process HttpEvent objects.
   * The generic type parameter "T" allows this operator to work with any type of HTTP response data.
   *
   * @param event An HttpEvent object representing an event in the HTTP request/response lifecycle.
   */
  return tap((value: HttpClientResponse<T>) => {
    const event = value as HttpEvent<T>;

    if (isPlainObject(event)
      && event.type === HttpEventType.UploadProgress
      && event.total) {
      // Calculate and emit the upload progress percentage
      const progress = Math.round((100 * event.loaded) / event.total);

      callback(progress);
    }
  });
}
