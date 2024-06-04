import { Directive, ElementRef, inject, Input, OnChanges } from '@angular/core';
import { ValidationErrors } from "@angular/forms";
import { ValidationErrorMessages } from "../types/validation-errors";
import { ERROR_MESSAGES } from "../../core/validation-error-messages.provider";

/**
 * Directive for displaying validation error messages associated with form controls.
 * Automatically updates the error message when the control's errors change.
 */
@Directive({
  selector: '[appValidationError]',
  standalone: true
})
export class ValidationErrorDirective implements OnChanges {
  // Get reference to the host element where the directive is applied
  private elementRef = inject(ElementRef);

  // Inject default error messages from the core module
  private defaultErrorMessages = inject(ERROR_MESSAGES);

  // Input for the control's validation errors
  @Input('appValidationError')
  errors!: ValidationErrors | null | undefined;

  // Optional input for custom error messages (field-specific)
  @Input()
  customMessages?: ValidationErrorMessages;

  /**
   * Lifecycle hook called when input properties change.
   * Triggers the update of the error message in the DOM.
   */
  ngOnChanges() {
    // Update the error message whenever the errors or customMessages change
    this.updateErrorMessage()
  }

  /**
   * Updates the displayed error message in the DOM.
   */
  private updateErrorMessage() {
    this.elementRef.nativeElement.textContent = this.generateErrorMessage();
  }

  /**
   * Generates the error message string based on the control's errors
   * and the provided custom or default messages.
   */
  private generateErrorMessage() {
    // No errors, so return an empty string
    if (!this.errors) return '';

    // Iterate over the errors and build the error message string
    return Object.entries(this.errors)
      .map(([key, value]) => {
        // Get message for each error
        return this.getErrorMessage(key, value);
      })
      // Join multiple errors
      .join('. ');
  }

  /**
   * Retrieves the appropriate error message for a given error key and value.
   * Prioritizes custom messages, then default messages, and falls back to 'unknown' if none found.
   */
  private getErrorMessage(key: string, value: any): string {
    if (typeof value === 'string' && value.length > 0) {
      // Custom error message provided as the value
      return value;
    }

    // Check for custom message first, then default message, then 'unknown' fallback
    return this.customMessages?.[key] || this.defaultErrorMessages[key] || this.defaultErrorMessages['unknown'];
  }
}
