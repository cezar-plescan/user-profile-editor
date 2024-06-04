import { Pipe, PipeTransform } from '@angular/core';
import { ValidationErrors } from "@angular/forms";
import { ValidationErrorMessages } from "../types/validation-errors";

const ERROR_MESSAGES: Record<string, string> = {
  unknown: 'This field has an error',
  required: 'This field is required',
  email: 'Please enter a valid email'
}

@Pipe({
  name: 'validationError',
  standalone: true
})
export class ValidationErrorPipe implements PipeTransform {

  transform(errors: ValidationErrors | null | undefined,
            customMessages?: ValidationErrorMessages): string {
    return errors ?
      Object.entries(errors)
        .map(([key, value]) =>
          typeof value === 'string' && value.length > 0 ?
            // if the value is a string, it is considered the error message itself
            value :
            value === true ?
              // check if there are any custom error messages
              customMessages && customMessages[key] ?
                customMessages[key] :
                // return default error messages
                ERROR_MESSAGES[key] ?
                  ERROR_MESSAGES[key] :
                  ERROR_MESSAGES['unknown'] :
              // if `value` is neither true nor a string, it is considered an unknown error
              ERROR_MESSAGES['unknown']
        )
        .join('. ') :
      '';
  }

}
