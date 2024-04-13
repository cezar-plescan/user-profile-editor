import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from "@angular/common";
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { HttpClient, HttpErrorResponse, HttpStatusCode } from "@angular/common/http";
import { catchError, EMPTY, finalize, map } from "rxjs";
import { pick } from "lodash-es";

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
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, NgOptimizedImage],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css'
})
export class UserProfileComponent implements OnInit {
  private httpClient = inject(HttpClient);

  protected form = inject(FormBuilder).group({
    name: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    address: new FormControl('', [Validators.required]),
    avatar: new FormControl('')
  });

  protected isLoadRequestInProgress = false;
  protected hasLoadingError = false;

  protected get isSaveButtonDisabled() {
    return !this.form.valid;
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
    this.form.setValue(pick(userData, Object.keys(this.form.value)) as UserProfileForm)
  }

  protected saveUserData() {
    this.saveUseData$()
      .pipe(
        catchError(error => {
          // handle server-side validation errors
          if (error instanceof HttpErrorResponse && error.status === HttpStatusCode.BadRequest) {
            this.setFormErrors(error.error)

            return EMPTY;
          }

          // if there is another type of error, throw it again.
          throw error;
        })
      )
      .subscribe()
  }

  private saveUseData$() {
    return this.httpClient.put<UserDataResponse>(`http://localhost:3000/users/1`, this.form.value)
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
}
