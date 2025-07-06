// pub use crate::ceil_division;
use crate::{FileContent, FileData, FileDownloadResponse, State, vetkeys::VetKeyService};
use candid::Principal;
// use ic_cdk::export::candid::Principal;
// use candid::Principal;
// use ic_cdk::println;

pub async fn download_file(s: &State, caller: Principal, file_id: u64, chunk_id: u64) -> Result<FileDownloadResponse, String> {
    // Check if caller is authenticated (not anonymous)
    if caller == Principal::anonymous() {
        return Ok(FileDownloadResponse::PermissionError);
    }

    // Check if the caller owns this file
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
            FileContent::Uploaded { file_type, num_chunks, vetkey_metadata } => {
                match s.file_contents.get(&(file_id, chunk_id)) {
                    Some(encrypted_contents) => {
                        // Decrypt the content using vetKeys
                        let decrypted_contents = VetKeyService::decrypt_file_for_user(
                            vetkey_metadata,
                            caller,
                            file_id,
                        ).await.map_err(|e| format!("Decryption failed: {}", e))?;
                        
                        Ok(FileDownloadResponse::FoundFile(FileData {
                            contents: decrypted_contents,
                            file_type: file_type.clone(),
                            num_chunks: *num_chunks,
                        }))
                    },
                    None => Ok(FileDownloadResponse::NotFoundFile),
                }
            }
            _ => Ok(FileDownloadResponse::NotUploadedFile),
        },
    }
}



// fn get_file_data(s: &State, file_id: u64, chunk_id: u64) -> FileDownloadResponse {
//     // unwrap is safe because we already know the file exists
//     let this_file = s.file_data.get(&file_id).unwrap();
//     match &this_file.content {
//         FileContent::Pending { .. } | FileContent::PartiallyUploaded { .. } => {
//             FileDownloadResponse::NotUploadedFile
//         }
//         FileContent::Uploaded {
//             file_type,
//             // Remove owner_key as it's no longer needed
//             // Instead, we'll just store the file type and metadata
//             // No need for shared_keys map either
//             // owner_key,
//             // shared_keys: _,
//             num_chunks,
//         } => FileDownloadResponse::FoundFile(FileData {
//             contents: s.file_contents.get(&(file_id, chunk_id)).unwrap(),
//             file_type: file_type.clone(),
//             // No need to store an encrypted key
//             // owner_key: owner_key.clone(),
//             num_chunks: *num_chunks,
//         }),
//     }
// }

// fn get_shared_file_data(
//     s: &State,
//     file_id: u64,
//     chunk_id: u64,
//     _user: Principal,
// ) -> FileDownloadResponse {
//     // unwrap is safe because we already know the file exists
//     let this_file = s.file_data.get(&file_id).unwrap();
//     match &this_file.content {
//         FileContent::Pending { .. } | FileContent::PartiallyUploaded { .. } => {
//             FileDownloadResponse::NotUploadedFile
//         }
//         FileContent::Uploaded {
//             file_type,
//             // owner_key: _,
//             // shared_keys,
//             num_chunks,
//         } => FileDownloadResponse::FoundFile(FileData {
//             contents: s.file_contents.get(&(file_id, chunk_id)).unwrap(),
//             file_type: file_type.clone(),
//             // owner_key: shared_keys.get(&user).unwrap().clone(),
//             num_chunks: *num_chunks,
//         }),
//     }
// }
// pub fn download_file(
//     s: &State,
//     file_id: u64,
//     chunk_id: u64,
//     caller: Principal,
// ) -> FileDownloadResponse {
//     match s.file_owners.get(&caller) {
//         // This is the case where the files is owned by this user.
//         Some(files) => match files.contains(&file_id) {
//             true => get_file_data(s, file_id, chunk_id),
//             false => {
//                 if is_file_shared_with_me(s, file_id, caller) {
//                     get_shared_file_data(s, file_id, chunk_id, caller)
//                 } else {
//                     FileDownloadResponse::PermissionError
//                 }
//             }
//         },
//         // But it could also be the case that the file is shared with this user.
//         None => {
//             if is_file_shared_with_me(s, file_id, caller) {
//                 get_shared_file_data(s, file_id, chunk_id, caller)
//             } else {
//                 FileDownloadResponse::PermissionError
//             }
//         }
//     }
// }

// fn is_file_shared_with_me(s: &State, file_id: u64, caller: Principal) -> bool {
//     match s.file_shares.get(&caller) {
//         None => false,
//         Some(arr) => arr.contains(&file_id),
//     }
// }

#[cfg(test)]
mod test {
    use super::*;
    use crate::{File, FileContent, FileData, FileMetadata, State};

    #[test]
    fn download_existing_uploaded_file() {
        let mut state = State::default();
        let test_principal = Principal::from_text("2vxsx-fae").unwrap();
        
        state.file_data.insert(
            0,
            File {
                metadata: FileMetadata {
                    file_name: "test_file.txt".to_string(),
                    requester_principal: test_principal,
                    requested_at: 12345,
                    uploaded_at: Some(12345),
                    storage_provider: "icp".to_string(),
                    blob_id: None,
                },
                content: FileContent::Uploaded {
                    num_chunks: 1,
                    file_type: "txt".to_string(),
                    owner_key: vec![1, 2, 3], // Test owner key
                },
            },
        );
        state.file_contents.insert((0, 0), vec![1, 2, 3]);
        
        // Add file to user's owned files
        state.file_owners.insert(test_principal, vec![0]);

        let result = download_file(&state, test_principal, 0, 0);
        assert_eq!(
            result,
            FileDownloadResponse::FoundFile(FileData {
                contents: vec![1, 2, 3],
                file_type: "txt".to_string(),
                num_chunks: 1,
            })
        );
    }

    #[test]
    fn download_nonexistent_file() {
        let state = State::default();
        let test_principal = Principal::from_text("2vxsx-fae").unwrap();
        let result = download_file(&state, test_principal, 42, 0);
        assert_eq!(result, FileDownloadResponse::NotFoundFile);
    }

    #[test]
    fn download_not_uploaded_file() {
        let mut state = State::default();
        let test_principal = Principal::from_text("2vxsx-fae").unwrap();
        
        state.file_data.insert(
            0,
            File {
                metadata: FileMetadata {
                    file_name: "test_file.txt".to_string(),
                    requester_principal: test_principal,
                    requested_at: 12345,
                    uploaded_at: None,
                    storage_provider: "icp".to_string(),
                    blob_id: None,
                },
                content: FileContent::Pending { alias: "abc".to_string() },
            },
        );
        
        // Add file to user's owned files
        state.file_owners.insert(test_principal, vec![0]);
        
        let result = download_file(&state, test_principal, 0, 0);
        assert_eq!(result, FileDownloadResponse::NotUploadedFile);
    }

    #[test]
    fn anonymous_user_cannot_download() {
        let state = State::default();
        let result = download_file(&state, Principal::anonymous(), 0, 0);
        assert_eq!(result, FileDownloadResponse::PermissionError);
    }

    #[test]
    fn wrong_user_cannot_download() {
        let mut state = State::default();
        let test_principal1 = Principal::from_text("2vxsx-fae").unwrap();
        let test_principal2 = Principal::from_text("3vxsx-fae").unwrap();
        
        state.file_data.insert(
            0,
            File {
                metadata: FileMetadata {
                    file_name: "test_file.txt".to_string(),
                    requester_principal: test_principal1,
                    requested_at: 12345,
                    uploaded_at: Some(12345),
                    storage_provider: "icp".to_string(),
                    blob_id: None,
                },
                content: FileContent::Uploaded {
                    num_chunks: 1,
                    file_type: "txt".to_string(),
                    owner_key: vec![1, 2, 3],
                },
            },
        );
        state.file_contents.insert((0, 0), vec![1, 2, 3]);
        
        // Add file to principal1's owned files
        state.file_owners.insert(test_principal1, vec![0]);
        
        // Try to download as principal2
        let result = download_file(&state, test_principal2, 0, 0);
        assert_eq!(result, FileDownloadResponse::PermissionError);
    }
}
