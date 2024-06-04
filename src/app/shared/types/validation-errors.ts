export type FieldValidationErrorMessages = {
  [field: string]: ValidationErrorMessages
} | undefined

export type ValidationErrorMessages = {
  [error: string]: string
}
