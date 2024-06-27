import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from "@angular/common";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { finalize } from "rxjs";
import { NotificationService } from "../services/notification.service";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { FieldValidationErrorMessages } from "../shared/types/validation-errors.type";
import { ValidationErrorDirective } from "../shared/directives/validation-error.directive";
import { ImageFormControlComponent } from "../shared/components/image-form-control/image-form-control.component";
import { tapValidationErrors } from "../shared/rxjs-operators/tap-validation-errors";
import { tapUploadProgress } from "../shared/rxjs-operators/tap-upload-progress";
import { tapResponseData } from "../shared/rxjs-operators/tap-response-data";
import { tapError } from "../shared/rxjs-operators/tap-error";
import { UserProfile, UserProfileForm } from "../shared/types/user.type";
import { UserService } from "../services/user.service";
import { FormHandlerService } from "../services/form-handler.service";

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, NgOptimizedImage, MatProgressBarModule, ValidationErrorDirective, ImageFormControlComponent],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css'
})
export class UserProfileComponent implements OnInit {
  private notification = inject(NotificationService);
  private userService = inject(UserService);
  private formHandlerService = inject<FormHandlerService<UserProfileForm, UserProfile>>(FormHandlerService);

  protected form = inject(FormBuilder).group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    address: ['', [Validators.required]],
    avatar: ['' as string | Blob]
  });

  protected errorMessages: FieldValidationErrorMessages = {
    name: {
      required: 'Please fill in the name'
    },
    email: {
      required: 'Please fill in the email'
    },
    address: {
      required: 'Please fill in the address'
    },
  };

  private userData: UserProfile | null = null;

  protected isLoadRequestInProgress = false;
  protected hasLoadingError = false;
  protected isSaveRequestInProgress = false;

  protected uploadProgress: number = 0;

  protected get isSaveButtonDisabled() {
    return this.formHandlerService.isSaveDisabled(this.form, this.userData, this.isSaveRequestInProgress);
  }

  protected get isResetButtonDisabled() {
    return this.formHandlerService.isResetDisabled(this.form, this.userData, this.isSaveRequestInProgress);
  }

  ngOnInit() {
    this.loadUserData();
  }

  protected loadUserData() {
    // set the loading flag when the request is initiated
    this.isLoadRequestInProgress = true;

    this.userService.getUserData$()
      .pipe(
        finalize(() => {
          // clear the loading flag when the request completes
          this.isLoadRequestInProgress = false;
        }),
        tapResponseData(data => {
            // clear the loading error flag
            this.hasLoadingError = false;

            // store the user data
            this.userData = data

            // display the user data in the form
            this.formHandlerService.updateForm(this.form, this.userData);
        }),
        tapError(() => {
          // set the loading error flag
          this.hasLoadingError = true;
        })
      )
      .subscribe()
  }

  /**
   * Initiates the process of saving the user data to the server.
   * This method handles UI interactions, error handling, and progress tracking during the save operation.
   */
  protected saveUserData() {
    // Set the flag to indicate that a save request is in progress
    this.isSaveRequestInProgress = true;

    this.userService.saveUserData$(this.form.value as UserProfileForm)
      .pipe(
        finalize(() => {
          // Clear the saving flag when the request is complete (success or error)
          this.isSaveRequestInProgress = false;

          // Reset the upload progress to 0
          this.uploadProgress = 0;
        }),
        // Handle successful response
        tapResponseData(data => {
          // Store the updated user data
          this.userData = data

          // Update the form with the new data
          this.restoreForm();

          // Display a success notification
          this.notification.display('The profile was successfully saved');
        }),
        // Handle validation errors (HTTP 400 Bad Request) from the server
        tapValidationErrors(errors => {
          // Set the validation errors on the form
          this.formHandlerService.setFormErrors(this.form, errors.error);
        }),
        tapUploadProgress(progress => {
          // Update the upload progress bar based on the progress received from the server
          this.uploadProgress = progress;
        })
      )
      // Subscribe to the observable to trigger the request
      .subscribe()
  }

  protected restoreForm() {
    this.formHandlerService.restoreForm(this.form, this.userData);
  }

}
