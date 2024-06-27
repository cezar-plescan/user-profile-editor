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
@Injectable()
export class FormHandlerService<FormType extends FormModel, DataType extends FormType> {
  /**
   * Private reference to the FormGroup instance this service will manage.
   * Note: This is not initialized in the constructor, but instead,
   *       it's expected to be set later using the `initForm` method.
   */
  private form!: FormGroup;

  /**
   * Initializes the service with the provided FormGroup instance.
   *
   * This method should be called in your component after the form is created to ensure
   * the service has access to the form and can operate on it.
   *
   * @param form The FormGroup instance to be managed by this service.
   */
  initForm(form: FormGroup) {
    this.form = form;
  }

  /**
   * Updates the values of a FormGroup based on the provided data object.
   *
   * @param data An object containing the new values for the form controls.
   *             Only properties matching the form control names will be updated.
   */
  updateForm(data: DataType) {
    // Pick only the relevant properties from the data object that match the form control names
    const filteredData = pick(data, Object.keys(this.form.value)) as FormType;

    // Reset the form with the filtered data, maintaining the existing form structure
    this.form.reset(filteredData);
  }

  /**
   * Sets validation errors on specific form controls based on an API error response.
   *
   * @param errorResponse The API error response object (ApiValidationErrorResponse).
   */
  setFormErrors(errorResponse: ApiValidationErrorResponse | null | undefined) {
    if (!errorResponse || !errorResponse.errors) {
      // If there are no errors in the response, clear any existing errors on the form
      this.form.setErrors(null);
      return;
    }

    errorResponse.errors.forEach(error => {
      // Get the form control for the field in error
      // Set the error on the form control using the error code as the key and the error message as the value
      this.form.get(error.field)?.setErrors({
        [error.code]: error.message
      })
    })
  }

  /**
   * Checks if the form value reflects the last value received from the backend.
   *
   * @param lastSavedData The data object representing the last saved state of the form, or null if not available.
   * @returns True if the form is pristine (unchanged since last save), false otherwise.
   */
  isFormPristine(lastSavedData: DataType | null): boolean {
    return Boolean(lastSavedData)
      && Boolean(this.form.value)
      && isEqual(
        this.form.value,
        pick(lastSavedData, Object.keys(this.form.value))
      )
  }

  /**
   * Checks if the Save button should be disabled based on form validity, pristine state, and save request status.
   *
   * @param lastSavedData The last saved data object, or null if not available.
   * @param isSaveRequestInProgress A boolean flag indicating if a save request is in progress.
   * @returns True if the Save button should be disabled, false otherwise.
   */
  isSaveDisabled(lastSavedData: DataType | null, isSaveRequestInProgress = false) {
    return !this.form.valid || this.isFormPristine(lastSavedData) || isSaveRequestInProgress;
  }

  /**
   * Checks if the Reset button should be disabled based on form pristine state and save request status.
   *
   * @param lastSavedData The last saved data object, or null if not available.
   * @param isSaveRequestInProgress A boolean flag indicating if a save request is in progress.
   * @returns True if the Reset button should be disabled, false otherwise.
   */
  isResetDisabled(lastSavedData: DataType | null, isSaveRequestInProgress = false) {
    return this.isFormPristine(lastSavedData) || isSaveRequestInProgress;
  }

  /**
   * Restores the form to its initial or pristine state using the provided data.
   *
   * @param data The data object to restore the form values from, or null to reset to empty.
   */
  restoreForm(data: DataType | null) {
    if (data) {
      this.updateForm(data);
    }
  }
}
