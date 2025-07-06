// use ic_cdk_macros::{post_upgrade, pre_upgrade, query, update};
use ic_cdk_macros::{query, update};
use vtk_backend::*;
use vtk_backend::api::UploadFileAtomicRequest;
use vtk_backend::api::DeleteFileResult;
use candid::Principal;
use vtk_backend::api::{RegisterFileRequest, RegisterFileResponse};
use vtk_backend::{CreateUserRequest, UpdateUserRequest, UserResponse, UserListResponse};
use vtk_backend::vetkd::controller::vetkd_public_key::VetkdPublicKeyResponse;

#[update]
fn upload_file_atomic(request: UploadFileAtomicRequest) -> u64 {
    let caller = ic_cdk::caller();
    with_state_mut(|s| vtk_backend::api::upload_file_atomic(caller, request, s))
}

#[update]
fn upload_file_continue(request: UploadFileContinueRequest) -> Result<(), UploadFileError> {
    let caller = ic_cdk::caller();
    with_state_mut(|s| vtk_backend::api::upload_file_continue(caller, request, s))
}

#[update]
fn register_file(request: RegisterFileRequest) -> RegisterFileResponse {
    let caller = ic_cdk::caller();
    vtk_backend::api::register_file(caller, request)
}

#[query]
fn download_file(file_id: u64, chunk_id: u64) -> FileDownloadResponse {
    let caller = ic_cdk::caller();
    with_state(|s| vtk_backend::api::download_file(s, caller, file_id, chunk_id))
}

#[update]
fn delete_file(file_id: u64) -> DeleteFileResult {
    let caller = ic_cdk::caller();
    with_state_mut(|s| vtk_backend::api::delete_file(s, caller, file_id))
}

#[update]
async fn vetkd_public_key() -> VetkdPublicKeyResponse {
    vtk_backend::vetkd::controller::vetkd_public_key::vetkd_public_key().await
}

#[query]
fn list_files() -> Vec<PublicFileMetadata> {
    let caller = ic_cdk::caller();
    with_state(|s| {
        // If caller is anonymous, return empty list
        if caller == Principal::anonymous() {
            panic!("Not authenticated");
        }

        // Get files owned by the caller
        let empty_vec = Vec::new();
        let owned_files = s.file_owners.get(&caller).unwrap_or(&empty_vec);
        
        owned_files.iter().filter_map(|&file_id| {
            s.file_data.get(&file_id).map(|file| {
                let file_status = match &file.content {
                    FileContent::Pending { alias } => FileStatus::Pending {
                        alias: alias.clone(),
                        requested_at: file.metadata.requested_at,
                    },
                    FileContent::PartiallyUploaded { .. } => FileStatus::PartiallyUploaded,
                    FileContent::Uploaded { .. } => FileStatus::Uploaded {
                        uploaded_at: file.metadata.uploaded_at.unwrap_or(file.metadata.requested_at),
                    },
                };

                PublicFileMetadata {
                    file_id,
                    file_name: file.metadata.file_name.clone(),
                    group_name: "".to_string(),          // Fill this if you use groups
                    group_alias: None,                   // Or Some(...) if available
                    file_status,
                    shared_with: vec![],                 // Empty vector for now since we don't support sharing yet
                }
            })
        }).collect()
    })
}


#[query]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}

// User management endpoints
#[update]
fn create_user_profile(request: CreateUserRequest) -> UserResponse {
    let caller = ic_cdk::caller();
    with_state_mut(|s| vtk_backend::api::create_user_profile(caller, request, s))
}

#[query]
fn get_user_profile() -> UserResponse {
    let caller = ic_cdk::caller();
    with_state(|s| vtk_backend::api::get_user_profile(caller, s))
}

#[update]
fn update_user_profile(request: UpdateUserRequest) -> UserResponse {
    let caller = ic_cdk::caller();
    with_state_mut(|s| vtk_backend::api::update_user_profile(caller, request, s))
}

#[update]
fn delete_user_profile() -> UserResponse {
    let caller = ic_cdk::caller();
    with_state_mut(|s| vtk_backend::api::delete_user_profile(caller, s))
}

#[query]
fn list_users() -> UserListResponse {
    let caller = ic_cdk::caller();
    with_state(|s| vtk_backend::api::list_users(caller, s))
}

#[query]
fn get_user_stats() -> UserResponse {
    let caller = ic_cdk::caller();
    with_state(|s| vtk_backend::api::get_user_stats(caller, s))
}

fn main() {}