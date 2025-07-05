import { ActorSubclass } from "@dfinity/agent";
import { 
  _SERVICE, 
  share_file_request,
  unshare_file_request,
  get_shared_files_response,
  file_sharing_response
} from "declarations/vtk_backend/vtk_backend.did";

export type ShareFileRequest = share_file_request;
export type UnshareFileRequest = unshare_file_request;
export type GetSharedFilesResponse = get_shared_files_response;
export type FileSharingResponse = file_sharing_response;

export class FileSharingService {
  private actor: ActorSubclass<_SERVICE>;

  constructor(actor: ActorSubclass<_SERVICE>) {
    this.actor = actor;
  }

  async shareFile(fileId: bigint, targetUsername: string): Promise<FileSharingResponse> {
    try {
      return await this.actor.share_file({
        file_id: fileId,
        target_username: targetUsername,
      });
    } catch (error) {
      console.error("Error sharing file:", error);
      throw error;
    }
  }

  async unshareFile(fileId: bigint, targetUsername: string): Promise<FileSharingResponse> {
    try {
      return await this.actor.unshare_file({
        file_id: fileId,
        target_username: targetUsername,
      });
    } catch (error) {
      console.error("Error unsharing file:", error);
      throw error;
    }
  }

  async getSharedFiles(): Promise<GetSharedFilesResponse> {
    try {
      return await this.actor.get_shared_files();
    } catch (error) {
      console.error("Error getting shared files:", error);
      throw error;
    }
  }

  // Helper method to check if a response is successful
  isFileSharingResponseOk(response: FileSharingResponse): boolean {
    return "ok" in response;
  }

  // Helper method to get error message from response
  getFileSharingErrorMessage(response: FileSharingResponse): string {
    if ("ok" in response) {
      return "Success";
    } else if ("permission_error" in response) {
      return "Permission denied";
    } else if ("not_authenticated" in response) {
      return "Not authenticated";
    } else if ("user_not_found" in response) {
      return "User not found";
    } else if ("file_not_found" in response) {
      return "File not found";
    } else if ("file_not_uploaded" in response) {
      return "File not uploaded";
    } else if ("invalid_input" in response) {
      return "Invalid input";
    } else {
      return "Unknown error";
    }
  }
} 