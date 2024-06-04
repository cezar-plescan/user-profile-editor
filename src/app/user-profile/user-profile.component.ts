import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule, NgOptimizedImage } from "@angular/common";
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { HttpClient, HttpErrorResponse, HttpEventType, HttpStatusCode } from "@angular/common/http";
import { catchError, EMPTY, finalize, map } from "rxjs";
import { isEqual, isString, pick } from "lodash-es";
import { NotificationService } from "../services/notification.service";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { FieldValidationErrorMessages } from "../shared/types/validation-errors";
import { ValidationErrorDirective } from "../shared/directives/validation-error.directive";

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
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, NgOptimizedImage, MatProgressBarModule, ValidationErrorDirective],
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

  @ViewChild('fileInput')
  protected fileInput!: ElementRef<HTMLInputElement>;

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
        catchError(error => {
          // handle server-side validation errors
          if (error instanceof HttpErrorResponse && error.status === HttpStatusCode.BadRequest) {
            this.setFormErrors(error.error)

            return EMPTY;
          }

          // display a notification when other errors occur
          this.notification.display('An unexpected error has occurred. Please try again later.')

          // if there is another type of error, throw it again.
          throw error;
        })
      )
      .subscribe((event) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.uploadProgress = event.total ?
            Math.round(100 * event.loaded / event.total) :
            100;
        }
        else if (event.type === HttpEventType.Response) {
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

    // reset the selected image, if any
    this.fileInput.nativeElement.value = '';
  }

  protected onImageSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];

    if (file) {
      this.form.controls.avatar.setValue(URL.createObjectURL(file));
    }
  }

  private getFormData() {
    const formData = new FormData();

    Object.entries(this.form.value).forEach(([fieldName, value]) => {
      if (fieldName === 'avatar') {
        value = this.fileInput.nativeElement.files?.[0] || value;
      }

      formData.append(fieldName, value as string | Blob);
    })

    return formData;
  }

  protected getAvatarFullUrl() {
    if (isString(this.form.controls.avatar.value)
      && this.form.controls.avatar.value
      && !this.form.controls.avatar.value.startsWith('blob:http')) {
      return 'http://localhost:3000/images/' + this.form.controls.avatar.value;
    }

    return this.form.controls.avatar.value || '/assets/avatar-placeholder.jpg';
  }
}
