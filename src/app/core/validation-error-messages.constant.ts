import { ValidationErrorMessages } from "../shared/types/validation-errors.type";

// Default error messages for common validation errors.
// These serve as the fallback messages when custom messages are not provided.
export const ERROR_MESSAGES_VALUE: ValidationErrorMessages = {
  unknown: 'This field has an error',
  required: 'This field is required',
  email: 'Please enter a valid email'
}
