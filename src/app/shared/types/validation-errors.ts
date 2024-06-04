/**
 * Represents a mapping of field names to their specific validation error messages.
 * Each field name is associated with an object containing error keys and their corresponding messages.
 * This type is optional, allowing for cases where no custom error messages are provided.
 */
export type FieldValidationErrorMessages = {
  // Map field names to their specific error messages.
  [field: string]: ValidationErrorMessages
} | undefined

/**
 * Represents a collection of validation error messages for a specific field.
 * Each error key (e.g., 'required', 'email') is associated with its corresponding error message.
 */
export type ValidationErrorMessages = {
  // Map error keys to their error messages.
  [error: string]: string
}
