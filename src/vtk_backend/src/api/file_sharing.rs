use crate::{State, PublicUser, FileSharingResponse};
use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};

#[derive(CandidType, Serialize, Deserialize, Debug, Clone)]
pub struct ShareFileRequest {
    pub file_id: u64,
    pub target_username: String,
}

#[derive(CandidType, Serialize, Deserialize, Debug, Clone)]
pub struct UnshareFileRequest {
    pub file_id: u64,
    pub target_username: String,
}

#[derive(CandidType, Serialize, Deserialize, Debug, Clone)]
pub struct GetSharedFilesResponse {
    pub owned_files: Vec<u64>,      // Files owned by the caller
    pub shared_files: Vec<u64>,     // Files shared with the caller
}

pub fn share_file(
    caller: Principal,
    request: ShareFileRequest,
    state: &mut State,
) -> FileSharingResponse {
    // Check if caller is authenticated
    if caller == Principal::anonymous() {
        return FileSharingResponse::NotAuthenticated;
    }

    // Check if the caller owns this file
    match state.file_owners.get(&caller) {
        Some(files) => {
            if !files.contains(&request.file_id) {
                return FileSharingResponse::PermissionError;
            }
        }
        None => return FileSharingResponse::PermissionError,
    }

    // Check if the target user exists
    let target_principal = match state.username_to_principal.get(&request.target_username) {
        Some(principal) => *principal,
        None => return FileSharingResponse::UserNotFound,
    };

    // Don't allow sharing with yourself
    if target_principal == caller {
        return FileSharingResponse::InvalidInput;
    }

    // Check if file exists and is uploaded
    match state.file_data.get(&request.file_id) {
        Some(file) => {
            match &file.content {
                crate::FileContent::Uploaded { .. } => {
                    // File is uploaded, can be shared
                }
                _ => return FileSharingResponse::FileNotUploaded,
            }
        }
        None => return FileSharingResponse::FileNotFound,
    }

    // Add the file to the target user's shared files
    state
        .file_shares
        .entry(target_principal)
        .or_insert_with(Vec::new)
        .push(request.file_id);

    FileSharingResponse::Ok
}

pub fn unshare_file(
    caller: Principal,
    request: UnshareFileRequest,
    state: &mut State,
) -> FileSharingResponse {
    // Check if caller is authenticated
    if caller == Principal::anonymous() {
        return FileSharingResponse::NotAuthenticated;
    }

    // Check if the caller owns this file
    match state.file_owners.get(&caller) {
        Some(files) => {
            if !files.contains(&request.file_id) {
                return FileSharingResponse::PermissionError;
            }
        }
        None => return FileSharingResponse::PermissionError,
    }

    // Check if the target user exists
    let target_principal = match state.username_to_principal.get(&request.target_username) {
        Some(principal) => *principal,
        None => return FileSharingResponse::UserNotFound,
    }

    // Remove the file from the target user's shared files
    if let Some(shared_files) = state.file_shares.get_mut(&target_principal) {
        shared_files.retain(|&id| id != request.file_id);
    }

    FileSharingResponse::Ok
}

pub fn get_shared_files(caller: Principal, state: &State) -> GetSharedFilesResponse {
    let owned_files = state
        .file_owners
        .get(&caller)
        .cloned()
        .unwrap_or_default();

    let shared_files = state
        .file_shares
        .get(&caller)
        .cloned()
        .unwrap_or_default();

    GetSharedFilesResponse {
        owned_files,
        shared_files,
    }
}

// Helper function to check if a file is shared with a user
pub fn is_file_shared_with_user(state: &State, file_id: u64, user_principal: Principal) -> bool {
    match state.file_shares.get(&user_principal) {
        Some(files) => files.contains(&file_id),
        None => false,
    }
}

// Helper function to get users that a file is shared with
pub fn get_file_shared_users(state: &State, file_id: u64) -> Vec<PublicUser> {
    let mut shared_users = Vec::new();
    
    for (principal, files) in &state.file_shares {
        if files.contains(&file_id) {
            if let Some(profile) = state.user_profiles.get(principal) {
                shared_users.push(PublicUser {
                    principal_id: profile.principal_id,
                    username: profile.username.clone(),
                    display_name: profile.display_name.clone(),
                });
            }
        }
    }
    
    shared_users
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{File, FileContent, FileMetadata, State};

    #[test]
    fn test_share_file() {
        let mut state = State::default();
        let owner_principal = Principal::from_text("2vxsx-fae").unwrap();
        let target_principal = Principal::from_text("3vxsx-fae").unwrap();

        // Create owner user profile
        state.user_profiles.insert(
            owner_principal,
            crate::UserProfile {
                principal_id: owner_principal,
                username: "owner".to_string(),
                display_name: Some("Owner User".to_string()),
                email: None,
                created_at: 12345,
                last_login: 12345,
                storage_used: 0,
                file_count: 0,
                is_active: true,
            },
        );

        // Create target user profile
        state.user_profiles.insert(
            target_principal,
            crate::UserProfile {
                principal_id: target_principal,
                username: "target".to_string(),
                display_name: Some("Target User".to_string()),
                email: None,
                created_at: 12345,
                last_login: 12345,
                storage_used: 0,
                file_count: 0,
                is_active: true,
            },
        );

        // Add username mappings
        state.username_to_principal.insert("owner".to_string(), owner_principal);
        state.username_to_principal.insert("target".to_string(), target_principal);

        // Create a file owned by the owner
        state.file_data.insert(
            0,
            File {
                metadata: FileMetadata {
                    file_name: "test_file.txt".to_string(),
                    requester_principal: owner_principal,
                    requested_at: 12345,
                    uploaded_at: Some(12345),
                    storage_provider: "icp".to_string(),
                    blob_id: None,
                },
                content: FileContent::Uploaded {
                    num_chunks: 1,
                    file_type: "txt".to_string(),
                    owner_key: vec![],
                },
            },
        );

        // Add file to owner's owned files
        state.file_owners.insert(owner_principal, vec![0]);

        // Share the file
        let request = ShareFileRequest {
            file_id: 0,
            target_username: "target".to_string(),
        };

        let result = share_file(owner_principal, request, &mut state);
        assert_eq!(result, FileSharingResponse::Ok);

        // Verify the file is now shared with the target user
        assert!(is_file_shared_with_user(&state, 0, target_principal));
    }

    #[test]
    fn test_unshare_file() {
        let mut state = State::default();
        let owner_principal = Principal::from_text("2vxsx-fae").unwrap();
        let target_principal = Principal::from_text("3vxsx-fae").unwrap();

        // Setup users and file (similar to above test)
        state.user_profiles.insert(
            owner_principal,
            crate::UserProfile {
                principal_id: owner_principal,
                username: "owner".to_string(),
                display_name: None,
                email: None,
                created_at: 12345,
                last_login: 12345,
                storage_used: 0,
                file_count: 0,
                is_active: true,
            },
        );

        state.user_profiles.insert(
            target_principal,
            crate::UserProfile {
                principal_id: target_principal,
                username: "target".to_string(),
                display_name: None,
                email: None,
                created_at: 12345,
                last_login: 12345,
                storage_used: 0,
                file_count: 0,
                is_active: true,
            },
        );

        state.username_to_principal.insert("owner".to_string(), owner_principal);
        state.username_to_principal.insert("target".to_string(), target_principal);

        // Create and share a file
        state.file_data.insert(
            0,
            File {
                metadata: FileMetadata {
                    file_name: "test_file.txt".to_string(),
                    requester_principal: owner_principal,
                    requested_at: 12345,
                    uploaded_at: Some(12345),
                    storage_provider: "icp".to_string(),
                    blob_id: None,
                },
                content: FileContent::Uploaded {
                    num_chunks: 1,
                    file_type: "txt".to_string(),
                    owner_key: vec![],
                },
            },
        );

        state.file_owners.insert(owner_principal, vec![0]);
        state.file_shares.insert(target_principal, vec![0]);

        // Unshare the file
        let request = UnshareFileRequest {
            file_id: 0,
            target_username: "target".to_string(),
        };

        let result = unshare_file(owner_principal, request, &mut state);
        assert_eq!(result, FileSharingResponse::Ok);

        // Verify the file is no longer shared
        assert!(!is_file_shared_with_user(&state, 0, target_principal));
    }
} 