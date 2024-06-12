import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from "@angular/common";
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { HttpClient, HttpErrorResponse, HttpEvent, HttpEventType, HttpStatusCode } from "@angular/common/http";
import { catchError, EMPTY, finalize, map } from "rxjs";
import { isEqual, pick } from "lodash-es";
import { NotificationService } from "../services/notification.service";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { FieldValidationErrorMessages } from "../shared/types/validation-errors";
import { ValidationErrorDirective } from "../shared/directives/validation-error.directive";
import { ImageFormControlComponent } from "../shared/components/image-form-control/image-form-control.component";
import { tapValidationErrors } from "../shared/rxjs-operators/tap-validation-errors";
import { tapUploadProgress } from "../shared/rxjs-operators/tap-upload-progress";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  address: string;
  avatar: string;
}

type UserProfileForm = Pick<UserProfile, "name" | "email" | "address" | "avatar">

interface UserDataResponse {
  status: 'ok';
  data: UserProfile;
}

export interface ValidationErrorResponse {
  message: string;
  errors: {
    field: string;
    message: string;
    code: string;
  }[]
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, NgOptimizedImage, MatProgressBarModule, ValidationErrorDirective, ImageFormControlComponent],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css'
})
export class UserProfileComponent implements OnInit {
  private httpClient = inject(HttpClient);
  private notification = inject(NotificationService);

  protected form = inject(FormBuilder).group({
    name: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    address: new FormControl('', [Validators.required]),
    avatar: new FormControl<string|Blob>('')
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
    return !this.form.valid || this.isFormPristine || this.isSaveRequestInProgress;
  }

  protected get isResetButtonDisabled() {
    return this.isFormPristine || this.isSaveRequestInProgress;
  }

  /**
   * Checks if the form value reflects the last value received from the backend
   */
  private get isFormPristine(): boolean {
    return Boolean(this.userData)
      && Boolean(this.form.value)
      && isEqual(
        this.form.value,
        pick(this.userData, Object.keys(this.form.value))
      )
  }

  ngOnInit() {
    this.loadUserData();
  }

  protected loadUserData() {
    // set the loading flag when the request is initiated
    this.isLoadRequestInProgress = true;

    this.getUserData$()
      .pipe(
        finalize(() => {
          // clear the loading flag when the request completes
          this.isLoadRequestInProgress = false;
        }),
        catchError((error: HttpErrorResponse) => {
          // set the loading error flag
          this.hasLoadingError = true;

          return EMPTY;
        })
      )
      .subscribe(userData => {
        // clear the loading error flag
        this.hasLoadingError = false;

        // store the user data
        this.userData = userData

        // display the user data in the form
        this.updateForm(userData);
      })
  }

  private getUserData$() {
    return this.httpClient.get<UserDataResponse>(`http://localhost:3000/users/1`).pipe(
      map(response => response.data)
    );
  }

  private updateForm(userData: UserProfile) {
    this.form.reset(pick(userData, Object.keys(this.form.value)) as UserProfileForm)
  }

  protected saveUserData() {
    // set the saving flag
    this.isSaveRequestInProgress = true;

    this.saveUserData$()
      .pipe(
        finalize(() => {
          // clear the saving flag
          this.isSaveRequestInProgress = false;

          // reset the progress
          this.uploadProgress = 0;
        }),
        // handle server-side validation errors
        tapValidationErrors(errors => {
          this.setFormErrors(errors.error)
        }),
        tapUploadProgress(progress => {
          this.uploadProgress = progress;
        }),
        catchError(error => {
          // display a notification when other errors occur
          this.notification.display('An unexpected error has occurred. Please try again later.')

          // if there is another type of error, throw it again.
          throw error;
        })
      )
      .subscribe((event) => {
        if (event.type === HttpEventType.Response) {
          // store the user data
          this.userData = event.body!.data

          // update the form with the values received from the server
          this.restoreForm();

          // display a success notification
          this.notification.display('The profile was successfully saved');
        }
      })
  }

  private saveUserData$() {
    return this.httpClient.put<UserDataResponse>(
      `http://localhost:3000/users/1`,
      this.getFormData(),
      {
        reportProgress: true,
        observe: 'events',
      })
  }

  private setFormErrors(errorResponse: ValidationErrorResponse | null | undefined) {
    if (!errorResponse || !errorResponse.errors) {
      this.form.setErrors(null);
      return;
    }

    errorResponse.errors.forEach(error => {
      this.form.get(error.field)?.setErrors({
        [error.code]: error.message
      })
    })
  }

  protected restoreForm() {
    this.userData && this.updateForm(this.userData);
  }

  private getFormData() {
    const formData = new FormData();

    Object.entries(this.form.value).forEach(([fieldName, value]) => {
      formData.append(fieldName, value as string | Blob);
    })

    return formData;
  }

}
