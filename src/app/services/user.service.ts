import { inject, Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { UserDataResponse, UserProfileForm } from "../shared/types/user.type";
import { HttpHelperService } from "./http-helper.service";
import { environment } from "../../environments/environment";

const USERS_API_PATH = 'users';

@Injectable({
  providedIn: 'root'
})
/**
 * A service for managing user data interactions with the backend API.
 */
export class UserService {
  private httpClient = inject(HttpClient);
  private httpHelper = inject(HttpHelperService);

  /**
   * Fetches user data from the API.
   *
   * @returns An observable of UserDataResponse containing the user profile information.
   */
  getUserData$() {
    return this.httpClient.get<UserDataResponse>(
      `${environment.apiBaseUrl}/${USERS_API_PATH}/1`
    );
  }

  /**
   * Saves updated user data to the API.
   *
   * @param userData The updated user profile data to be saved.
   * @returns An observable of HttpEvent<UserDataResponse>, emitting events during the save process,
   *          including upload progress (if applicable) and the final response.
   */
  saveUserData$(userData: UserProfileForm) {
    return this.httpClient.put<UserDataResponse>(
      `${environment.apiBaseUrl}/${USERS_API_PATH}/1`,
      this.httpHelper.generateFormData(userData),
      {
        // Enable progress reporting for file uploads
        reportProgress: true,
        // Emit all events during the request/response lifecycle
        observe: 'events',
      })
  }

}
