// import {
//   share_file_request,
//   unshare_file_request,
//   get_shared_files_response,
//   file_sharing_response,
// } from "declarations/vtk_backend/vtk_backend.did";

// TODO: Implement file sharing functionality when backend supports it
export class FileSharingService {
  constructor(private actor: any) {}

  async shareFile(fileId: bigint, userPrincipal: string): Promise<void> {
    // TODO: Implement when backend supports file sharing
    console.warn("File sharing not yet implemented");
    throw new Error("File sharing not yet implemented");
    
    // const request: share_file_request = {
    //   file_id: fileId,
    //   user_principal: userPrincipal,
    // };
    // await this.actor.share_file(request);
  }

  async unshareFile(fileId: bigint, userPrincipal: string): Promise<void> {
    // TODO: Implement when backend supports file sharing
    console.warn("File sharing not yet implemented");
    throw new Error("File sharing not yet implemented");
    
    // const request: unshare_file_request = {
    //   file_id: fileId,
    //   user_principal: userPrincipal,
    // };
    // await this.actor.unshare_file(request);
  }

  async getSharedFiles(): Promise<any[]> {
    // TODO: Implement when backend supports file sharing
    console.warn("File sharing not yet implemented");
    return [];
    
    // const response: get_shared_files_response = await this.actor.get_shared_files();
    // return response;
  }

  // Helper method to check if a response is successful
  isFileSharingResponseOk(response: any): boolean {
    return "ok" in response;
  }

  // Helper method to get error message from response
  getFileSharingErrorMessage(response: any): string {
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