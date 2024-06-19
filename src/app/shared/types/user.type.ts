import { ApiSuccessResponse } from "./http-response.type";

/**
 * Represents the structure of a user profile object.
 * This interface defines the properties expected in a user profile.
 */
export interface UserProfile {
  id: number; // A unique identifier for the user.
  name: string; // The user's full name.
  email: string; // The user's email address.
  address: string; // The user's address.
  avatar: string; // A URL or path to the user's avatar image.
}

/**
 * Represents the format of a successful user data response from the API.
 * It extends the ApiSuccessResponse interface, specifying the data payload as a UserProfile object.
 */
export type UserDataResponse = ApiSuccessResponse<UserProfile>;

/**
 * Represents the subset of UserProfile properties used in the user profile form.
 * This type is derived from UserProfile using the Pick utility type,
 * selecting only the 'name', 'email', 'address', and 'avatar' properties.
 */
export type UserProfileForm = Pick<UserProfile, "name" | "email" | "address" | "avatar">

