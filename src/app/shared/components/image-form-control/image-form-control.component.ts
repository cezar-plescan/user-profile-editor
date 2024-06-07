import { Component } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";

@Component({
  selector: 'app-image-form-control',
  standalone: true,
  imports: [],
  templateUrl: './image-form-control.component.html',
  styleUrl: './image-form-control.component.css',
  // Register this component as a ControlValueAccessor
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: ImageFormControlComponent,
      multi: true
    }
  ]
})
export class ImageFormControlComponent implements ControlValueAccessor {
  // The source URL for the displayed image
  protected imgSrc?: string;

  registerOnChange(fn: any): void {
  }

  registerOnTouched(fn: any): void {
  }

  setDisabledState(isDisabled: boolean): void {
  }

  /**
   * Writes a new value from the form model into the view.
   * In this case, it sets the imgSrc based on the provided value (image filename).
   * Required by the ControlValueAccessor interface.
   */
  writeValue(value: string): void {
    this.imgSrc = value ? `http://localhost:3000/images/${value}` : ''
  }
}
