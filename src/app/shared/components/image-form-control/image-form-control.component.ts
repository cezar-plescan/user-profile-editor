import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

@Component({
  selector: 'app-image-form-control',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule
  ],
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
export class ImageFormControlComponent implements ControlValueAccessor, OnDestroy {
  // The source URL for the displayed image
  protected imgSrc?: string;

  // A function to notify the form of value changes (set by Angular)
  protected onChange: Function | undefined;

  /**
   * Obtains a reference to the file input element using ViewChild.
   * This reference is used to clear the input's value after an image is selected or written.
   * The {static: true} option ensures the reference is available during initialization.
   */
  @ViewChild('fileInput', {static: true})
  protected fileInput!: ElementRef<HTMLInputElement>;

  /**
   * Registers a callback function (fn) that should be called when the control's value changes in the UI.
   * This function is provided by Angular forms API and is essential for two-way binding.
   */
  registerOnChange(fn: Function): void {
    this.onChange = fn;
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
    this.imgSrc = value;

    // Clear the file input element's value after setting the image source
    this.fileInput.nativeElement.value = '';
  }

  /**
   * Handles the file selection event when the user chooses an image.
   * @param event - The change event triggered by the file input element.
   */
  protected onImageSelected(event: Event) {
    // Retrieve the selected file from the input element
    let file = (event.target as HTMLInputElement).files?.[0];

    if (file) {
      // Clean up previous blob URL if it exists.
      this.revokeImageURL();

      // Generate a temporary URL for the selected image and update the image source.
      this.imgSrc = this.generateImageURL(file);

      // Notify the form control that the value has changed.
      // This triggers validation and updates the form's state.
      this.onChange?.(file);
    }
  }

  /**
   * Angular lifecycle hook called when the component is destroyed.
   */
  ngOnDestroy() {
    // Ensures any existing blob URLs are revoked to prevent memory leaks.
    this.revokeImageURL()
  }

  /**
   * Revokes the object URL associated with the image source if it's a blob URL.
   */
  private revokeImageURL() {
    if (this.imgSrc && this.imgSrc.startsWith('blob:')) {
      URL.revokeObjectURL(this.imgSrc);
      // Reset the imgSrc because it points to an invalid URL
      this.imgSrc = undefined;
    }
  }

  /**
   * Generates a temporary blob URL for the given file.
   * @param file - The File object to generate a URL for.
   * @returns A blob URL string that can be used to display the file in the browser.
   */
  private generateImageURL(file: File): string {
    return URL.createObjectURL(file)
  }

}
