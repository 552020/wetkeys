// use ic_cdk_macros::{post_upgrade, pre_upgrade, query, update};
use ic_cdk_macros::{query, update};
use vtk_backend::*;
use vtk_backend::api::UploadFileAtomicRequest;
use vtk_backend::api::DeleteFileResult;
use candid::Principal;
use vtk_backend::api::{RegisterFileRequest, RegisterFileResponse};
use vtk_backend::{CreateUserRequest, UpdateUserRequest, UserResponse, UserListResponse};
// VetKey methods are already defined in the vetkd module

#[update]
fn upload_file_atomic(request: UploadFileAtomicRequest) -> Result<u64, String> {
    let caller = ic_cdk::caller();
    with_state_mut(|s| {
        // For now, we'll use a simplified version without vetKey encryption
        // TODO: Implement proper async vetKey integration
        if caller == Principal::anonymous() {
            return Err("Not authenticated".to_string());
        }

        let file_id = s.generate_file_id();
        
        // Create a simple encrypted data structure for now
        let encrypted_data = crate::vetkeys::EncryptedFileData {
            encrypted_content: request.content.clone(),
            file_owners: vec![caller],
            encryption_metadata: std::collections::HashMap::new(),
        };
        
        let content = if request.num_chunks == 1 {
            crate::FileContent::Uploaded {
                num_chunks: request.num_chunks,
                file_type: request.file_type.clone(),
                vetkey_metadata: encrypted_data,
            }
        } else {
            crate::FileContent::PartiallyUploaded {
                num_chunks: request.num_chunks,
                file_type: request.file_type.clone(),
                vetkey_metadata: encrypted_data,
            }
        };
        
        s.file_contents.insert((file_id, 0), request.content.clone());
        s.file_data.insert(
            file_id,
            crate::File {
                metadata: crate::FileMetadata {
                    file_name: request.name,
                    requester_principal: caller,
                    requested_at: crate::get_time(),
                    uploaded_at: Some(crate::get_time()),
                    storage_provider: "icp".to_string(),
                    blob_id: None,
                    is_encrypted: true, // Mark as VetKey encrypted
                },
                content,
            },
        );

        s.file_owners
            .entry(caller)
            .or_insert_with(Vec::new)
            .push(file_id);

        Ok(file_id)
    })
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
fn download_file(file_id: u64, chunk_id: u64) -> Result<FileDownloadResponse, String> {
    let caller = ic_cdk::caller();
    with_state(|s| {
        // For now, we'll use a simplified version without vetKey decryption
        // TODO: Implement proper async vetKey integration
        if caller == Principal::anonymous() {
            return Ok(FileDownloadResponse::PermissionError);
        }

        match s.file_owners.get(&caller) {
            Some(files) => {
                if !files.contains(&file_id) {
                    return Ok(FileDownloadResponse::PermissionError);
                }
            }
            None => return Ok(FileDownloadResponse::PermissionError),
        }

        match s.file_data.get(&file_id) {
            None => Ok(FileDownloadResponse::NotFoundFile),
            Some(file) => match &file.content {
                crate::FileContent::Uploaded { file_type, num_chunks, vetkey_metadata: _ } => {
                    match s.file_contents.get(&(file_id, chunk_id)) {
                        Some(contents) => Ok(FileDownloadResponse::FoundFile(crate::FileData {
                            contents: contents.clone(),
                            file_type: file_type.clone(),
                            num_chunks: *num_chunks,
                        })),
                        None => Ok(FileDownloadResponse::NotFoundFile),
                    }
                }
                _ => Ok(FileDownloadResponse::NotUploadedFile),
            },
        }
    })
}

#[update]
fn delete_file(file_id: u64) -> DeleteFileResult {
    let caller = ic_cdk::caller();
    with_state_mut(|s| vtk_backend::api::delete_file(s, caller, file_id))
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

// === VetKey Methods ===
#[ic_cdk::query]
async fn vetkd_public_key() -> Result<Vec<u8>, String> {
    vtk_backend::vetkd::vetkd_public_key().await
}

#[ic_cdk::update]
async fn vetkd_encrypted_key(encryption_public_key: Vec<u8>, file_id: Option<u64>) -> Result<Vec<u8>, String> {
    vtk_backend::vetkd::vetkd_encrypted_key(encryption_public_key, file_id).await
}

fn main() {}