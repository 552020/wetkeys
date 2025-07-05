use crate::{FileMetadata, State, with_state_mut};
use candid::CandidType;
use serde::{Deserialize, Serialize};

#[derive(CandidType, Serialize, Deserialize, Debug, Clone)]
pub struct RegisterFileRequest {
    pub file_name: String,
    pub storage_provider: String, // "icp" or "walrus"
    pub blob_id: Option<String>,  // Only for Walrus
    pub requested_at: u64,
    pub uploaded_at: Option<u64>,
}

#[derive(CandidType, Serialize, Deserialize, Debug, Clone)]
pub struct RegisterFileResponse {
    pub file_id: u64,
}

pub fn register_file(req: RegisterFileRequest) -> RegisterFileResponse {
    with_state_mut(|state: &mut State| {
        let file_id = state.generate_file_id();
        let metadata = FileMetadata {
            file_name: req.file_name,
            requested_at: req.requested_at,
            uploaded_at: req.uploaded_at,
            storage_provider: req.storage_provider,
            blob_id: req.blob_id,
        };
        // Insert into file_data with empty content for now
        state.file_data.insert(file_id, crate::File {
            metadata,
            content: crate::FileContent::Pending { alias: String::new() },
        });
        RegisterFileResponse { file_id }
    })
} 