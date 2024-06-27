import { Injectable } from '@angular/core';
import { isEqual, pick } from "lodash-es";
import { ApiValidationErrorResponse } from "../shared/types/http-response.type";
import { FormGroup } from "@angular/forms";
import { FormModel } from "../shared/types/form.type";

/**
 * A service for handling form-related operations in Angular components.
 *
 * @template FormType The type of the form data (e.g., an interface defining the form fields).
 * @template DataType The type of the data model that the form represents.
 *                    This should usually extend FormType, as form data is a subset of the model.
 */
@Injectable({
  providedIn: 'root'
})
export class FormHandlerService<FormType extends FormModel, DataType extends FormType> {

  /**
   * Updates the values of a FormGroup based on the provided data object.
   *
   * @param form The FormGroup instance to update.
   * @param data An object containing the new values for the form controls.
   *             Only properties matching the form control names will be updated.
   */
  updateForm(form: FormGroup, data: DataType) {
    // Pick only the relevant properties from the data object that match the form control names
    const filteredData = pick(data, Object.keys(form.value)) as FormType;

    // Reset the form with the filtered data, maintaining the existing form structure
    form.reset(filteredData);
  }

  /**
   * Sets validation errors on specific form controls based on an API error response.
   *
   * @param form The FormGroup instance to set errors on.
   * @param errorResponse The API error response object (ApiValidationErrorResponse).
   */
  setFormErrors(form: FormGroup, errorResponse: ApiValidationErrorResponse | null | undefined) {
    if (!errorResponse || !errorResponse.errors) {
      // If there are no errors in the response, clear any existing errors on the form
      form.setErrors(null);
      return;
    }

    errorResponse.errors.forEach(error => {
      // Get the form control for the field in error
      // Set the error on the form control using the error code as the key and the error message as the value
      form.get(error.field)?.setErrors({
        [error.code]: error.message
      })
    })
  }

  /**
   * Checks if the form value reflects the last value received from the backend.
   *
   * @param form The FormGroup instance to check.
   * @param lastSavedData The data object representing the last saved state of the form, or null if not available.
   * @returns True if the form is pristine (unchanged since last save), false otherwise.
   */
  isFormPristine(form: FormGroup, lastSavedData: DataType | null): boolean {
    return Boolean(lastSavedData)
      && Boolean(form.value)
      && isEqual(
        form.value,
        pick(lastSavedData, Object.keys(form.value))
      )
  }

  /**
   * Checks if the Save button should be disabled based on form validity, pristine state, and save request status.
   *
   * @param form The FormGroup instance.
   * @param lastSavedData The last saved data object, or null if not available.
   * @param isSaveRequestInProgress A boolean flag indicating if a save request is in progress.
   * @returns True if the Save button should be disabled, false otherwise.
   */
  isSaveDisabled(form: FormGroup, lastSavedData: DataType | null, isSaveRequestInProgress = false) {
    return !form.valid || this.isFormPristine(form, lastSavedData) || isSaveRequestInProgress;
  }

  /**
   * Checks if the Reset button should be disabled based on form pristine state and save request status.
   *
   * @param form The FormGroup instance.
   * @param lastSavedData The last saved data object, or null if not available.
   * @param isSaveRequestInProgress A boolean flag indicating if a save request is in progress.
   * @returns True if the Reset button should be disabled, false otherwise.
   */
  isResetDisabled(form: FormGroup, lastSavedData: DataType | null, isSaveRequestInProgress = false) {
    return this.isFormPristine(form, lastSavedData) || isSaveRequestInProgress;
  }

  /**
   * Restores the form to its initial or pristine state using the provided data.
   *
   * @param form The FormGroup instance.
   * @param data The data object to restore the form values from, or null to reset to empty.
   */
  restoreForm(form: FormGroup, data: DataType | null) {
    if (data) {
      this.updateForm(form, data);
    }
  }
}
