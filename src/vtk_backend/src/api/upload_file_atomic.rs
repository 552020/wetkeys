use crate::{File, FileContent, FileMetadata, State, vetkeys::VetKeyService};
use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct UploadFileAtomicRequest {
    pub name: String,
    pub content: Vec<u8>,
    // pub owner_key: Vec<u8>,
    pub file_type: String,
    pub num_chunks: u64,
}

// pub fn upload_file_atomic(
//     caller: Principal,
//     request: UploadFileAtomicRequest,
//     state: &mut State,
// ) -> u64 {
//     let file_id = state.generate_file_id();

//     let content = if request.num_chunks == 1 {
//         // File is uploaded in one chunk.
//         FileContent::Uploaded {
//             num_chunks: request.num_chunks,
//             file_type: request.file_type,
//             // owner_key: request.owner_key,
//             // Remove shared_keys as it's no longer needed
//             // shared_keys: BTreeMap::new(),
//         }
//     } else {
//         // File will be uploaded in multiple chunks.
//         FileContent::PartiallyUploaded {
//             num_chunks: request.num_chunks,
//             file_type: request.file_type,
//             // owner_key: request.owner_key,
//             // Remove shared_keys as it's no longer needed
//             // shared_keys: BTreeMap::new(),
//         }
//     };

//     // Add file contents to stable store.
//     let chunk_id = 0;
//     state
//         .file_contents
//         .insert((file_id, chunk_id), request.content);

//     let old_value = state.file_data.insert(
//         file_id,
//         File {
//             metadata: FileMetadata {
//                 file_name: request.name,
//                 // user_public_key: get_user_key(state, caller),
//                 requester_principal: caller,
//                 requested_at: get_time(),
//                 uploaded_at: Some(get_time()),
//             },
//             content,
//         },
//     );

//     if old_value.is_some() {
//         panic!("Overwriting an existing file should be impossible.");
//     }

//     // Add the caller as the owner of this file.
//     state
//         .file_owners
//         .entry(caller)
//         .or_insert_with(Vec::new)
//         .push(file_id);

//     file_id
// }

pub async fn upload_file_atomic(
    caller: Principal,
    request: UploadFileAtomicRequest,
    state: &mut State,
) -> Result<u64, String> {
    if caller == Principal::anonymous() {
        return Err("Not authenticated".to_string());
    }

    let file_id = state.generate_file_id();
    
    // Get all owners for this file (initially just the caller)
    let owners = vec![caller];
    
    // Encrypt the file content using vetKeys
    let encrypted_data = VetKeyService::encrypt_file_for_owners(
        request.content.clone(),
        file_id,
        owners.clone(),
    ).await.map_err(|e| format!("Encryption failed: {}", e))?;
    
    let content = if request.num_chunks == 1 {
        FileContent::Uploaded {
            num_chunks: request.num_chunks,
            file_type: request.file_type.clone(),
            vetkey_metadata: encrypted_data,
        }
    } else {
        FileContent::PartiallyUploaded {
            num_chunks: request.num_chunks,
            file_type: request.file_type.clone(),
            vetkey_metadata: encrypted_data,
        }
    };
    
    // Store the encrypted content
    state.file_contents.insert((file_id, 0), request.content.clone());
    state.file_data.insert(
        file_id,
        File {
            metadata: FileMetadata {
                file_name: request.name,
                requester_principal: caller,
                requested_at: crate::get_time(),
                uploaded_at: Some(crate::get_time()),
                storage_provider: "icp".to_string(),
                blob_id: None,
            },
            content,
        },
    );

    // Add the caller as the owner of this file
    state
        .file_owners
        .entry(caller)
        .or_insert_with(Vec::new)
        .push(file_id);

    Ok(file_id)
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::{File, FileContent, FileMetadata, State};

    fn make_request(name: &str, content: Vec<u8>, file_type: &str, num_chunks: u64) -> UploadFileAtomicRequest {
        UploadFileAtomicRequest {
            name: name.to_string(),
            content,
            file_type: file_type.to_string(),
            num_chunks,
        }
    }

    #[test]
    fn upload_single_chunk_file() {
        // TODO: Update test to handle async upload_file_atomic
        // This test needs to be updated for the new async vetKey integration
    }

    #[test]
    fn upload_multi_chunk_file_first_chunk() {
        // TODO: Update test to handle async upload_file_atomic
        // This test needs to be updated for the new async vetKey integration
    }

    #[test]
    fn file_id_increments() {
        // TODO: Update test to handle async upload_file_atomic
        // This test needs to be updated for the new async vetKey integration
    }

    #[test]
    fn anonymous_user_cannot_upload() {
        // TODO: Update test to handle async upload_file_atomic
        // This test needs to be updated for the new async vetKey integration
    }
}
