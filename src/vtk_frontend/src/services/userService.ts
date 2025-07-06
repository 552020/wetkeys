import { ActorSubclass } from "@dfinity/agent";
import { 
  _SERVICE, 
  user_profile, 
  create_user_request, 
  update_user_request,
  user_response,
  user_list_response
} from "declarations/vtk_backend/vtk_backend.did";

export type UserProfile = user_profile;
export type CreateUserRequest = create_user_request;
export type UpdateUserRequest = update_user_request;
export type UserResponse = user_response;
export type UserListResponse = user_list_response;

export class UserService {
  private actor: ActorSubclass<_SERVICE>;

  constructor(actor: ActorSubclass<_SERVICE>) {
    this.actor = actor;
  }

  async createUserProfile(request: CreateUserRequest): Promise<UserResponse> {
    try {
      return await this.actor.create_user_profile(request);
    } catch (error) {
      console.error("Error creating user profile:", error);
      throw error;
    }
  }

  async getUserProfile(): Promise<UserResponse> {
    try {
      return await this.actor.get_user_profile();
    } catch (error) {
      console.error("Error getting user profile:", error);
      throw error;
    }
  }

  async updateUserProfile(request: UpdateUserRequest): Promise<UserResponse> {
    try {
      return await this.actor.update_user_profile(request);
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  }

  async deleteUserProfile(): Promise<UserResponse> {
    try {
      return await this.actor.delete_user_profile();
    } catch (error) {
      console.error("Error deleting user profile:", error);
      throw error;
    }
  }

  async listUsers(): Promise<UserListResponse> {
    try {
      return await this.actor.list_users();
    } catch (error) {
      console.error("Error listing users:", error);
      throw error;
    }
  }

  async getUserStats(): Promise<UserResponse> {
    try {
      return await this.actor.get_user_stats();
    } catch (error) {
      console.error("Error getting user stats:", error);
      throw error;
    }
  }

  // Helper method to format storage size
  formatStorageSize(bytes: bigint): string {
    const bytesNum = Number(bytes);
    if (bytesNum === 0) return "0 B";
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytesNum) / Math.log(k));
    
    return parseFloat((bytesNum / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Helper method to format timestamp
  formatTimestamp(timestamp: bigint): string {
    const date = new Date(Number(timestamp) / 1000000); // Convert from nanoseconds
    return date.toLocaleString();
  }

  // Helper method to check if user response is successful
  isUserResponseOk(response: UserResponse): response is { Ok: UserProfile } {
    return 'Ok' in response;
  }

  // Helper method to check if user list response is successful
  isUserListResponseOk(response: UserListResponse): response is { Ok: UserProfile[] } {
    return 'Ok' in response;
  }
} 