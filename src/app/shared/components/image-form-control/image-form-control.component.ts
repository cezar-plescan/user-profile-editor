import { Component, OnDestroy } from '@angular/core';
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
export class ImageFormControlComponent implements ControlValueAccessor, OnDestroy {
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
