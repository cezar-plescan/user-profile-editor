import { Injectable } from '@angular/core';
import { isPlainObject } from "lodash-es";

@Injectable({
  providedIn: 'root'
})
export class HttpHelperService {
  /**
   * Generates a FormData object from the given form values.
   *
   * @param values An object containing the form field values.
   * @returns The FormData object ready to be sent in an HTTP request.
   */
  generateFormData<T extends Record<string, any>>(values: T): FormData {
    const formData = new FormData();

    Object.entries(values).forEach(([key, value]) => {
      // Check if the value is a plain object (not a Blob or File)
      const transformedValue = isPlainObject(value) ?
        // Serialize objects to JSON strings
        JSON.stringify(value)
        // Otherwise, use the value as-is (Blobs, Files, strings, etc.)
        : value;

      // Append the key-value pair to FormData
      formData.append(key, transformedValue);
    });

    return formData;
  }
}
