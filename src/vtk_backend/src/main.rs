// use ic_cdk_macros::{post_upgrade, pre_upgrade, query, update};
use ic_cdk_macros::{query, update};
use vtk_backend::*;
use vtk_backend::api::{UploadFileAtomicRequest, ShareFileRequest};
use vtk_backend::api::DeleteFileResult;
use candid::Principal;
use vtk_backend::api::{RegisterFileRequest, RegisterFileResponse};

#[update]
async fn upload_file_atomic(request: UploadFileAtomicRequest) -> Result<u64, VetKeysError> {
    let caller = ic_cdk::caller();
    let mut request_with_caller = request;
    request_with_caller.caller = caller;
    
    with_state_mut(|s| async {
        vtk_backend::api::upload_file_atomic(request_with_caller, s).await
    }).await
}

#[update]
fn upload_file_continue(request: UploadFileContinueRequest) {
    with_state_mut(|s| vtk_backend::api::upload_file_continue(request, s))
}

#[update]
fn register_file(request: RegisterFileRequest) -> RegisterFileResponse {
    vtk_backend::api::register_file(request)
}

#[query]
async fn download_file(file_id: u64, chunk_id: u64) -> FileDownloadResponse {
    let caller = ic_cdk::caller();
    with_state(|s| async {
        vtk_backend::api::download_file(s, file_id, chunk_id, caller).await
    }).await
}

#[update]
fn delete_file(file_id: u64) -> DeleteFileResult {
    with_state_mut(|s| vtk_backend::api::delete_file(s, file_id))
}

#[update]
async fn share_file(request: ShareFileRequest) -> FileSharingResponse {
    let caller = ic_cdk::caller();
    with_state_mut(|s| async {
        vtk_backend::api::share_file(s, request.file_id, caller, request).await
    }).await
}

#[query]
fn list_files() -> Vec<PublicFileMetadata> {
    with_state(|s| {
        s.file_data.iter().map(|(file_id, file)| {
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
                file_id: *file_id,
                file_name: file.metadata.file_name.clone(),
                group_name: "".to_string(),          // Fill this if you use groups
                group_alias: None,                   // Or Some(...) if available
                file_status,
            }
        }).collect()
    })
}

#[query]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}

fn main() {}