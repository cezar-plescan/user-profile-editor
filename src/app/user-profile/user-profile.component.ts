import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from "@angular/common";
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
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
}
