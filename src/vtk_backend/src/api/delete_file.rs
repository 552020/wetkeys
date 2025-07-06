use crate::{FileContent, State};
use candid::{CandidType, Principal};
use serde::{Serialize, Deserialize};

#[derive(CandidType, Serialize, Deserialize, Debug, PartialEq, Eq)]
pub enum DeleteFileResult {
    Ok,
    NotFound,
    NotAuthenticated,
    PermissionError,
}

pub fn delete_file(state: &mut State, caller: Principal, file_id: u64) -> DeleteFileResult {
    // Check if caller is authenticated (not anonymous)
    if caller == Principal::anonymous() {
        return DeleteFileResult::NotAuthenticated;
    }

    // Check if the user owns this file
    match state.file_owners.get(&caller) {
        Some(files) => {
            if !files.contains(&file_id) {
                return DeleteFileResult::PermissionError;
            }

            if let Some(file) = state.file_data.remove(&file_id) {
                // Remove all chunks
                let num_chunks = match file.content {
                    FileContent::Uploaded { num_chunks, .. } |
                    FileContent::PartiallyUploaded { num_chunks, .. } => num_chunks,
                    FileContent::Pending { .. } => 0,
                };
                for chunk_id in 0..num_chunks {
                    state.file_contents.remove(&(file_id, chunk_id));
                }

                // Remove the file from the user's owned files
                if let Some(user_files) = state.file_owners.get_mut(&caller) {
                    user_files.retain(|&id| id != file_id);
                }

                DeleteFileResult::Ok
            } else {
                DeleteFileResult::NotFound
            }
        }
        None => DeleteFileResult::PermissionError,
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::{File, FileContent, FileMetadata, State};

    #[test]
    fn delete_existing_file() {
        let mut state = State::default();
        let test_principal = Principal::from_text("2vxsx-fae").unwrap();

        // Insert a file manually
        state.file_data.insert(
            0,
            File {
                metadata: FileMetadata {
                    file_name: "test_file.txt".to_string(),
                    requester_principal: test_principal,
                    requested_at: 12345,
                    uploaded_at: Some(12345),
                },
                content: FileContent::Uploaded {
                    num_chunks: 1,
                    file_type: "txt".to_string(),
                },
            },
        );
        // Insert a chunk
        state.file_contents.insert((0, 0), vec![1, 2, 3]);

        // Add file to user's owned files
        state.file_owners.insert(test_principal, vec![0]);

        // Delete the file
        let result = delete_file(&mut state, test_principal, 0);

        // Check result and that file is gone
        assert_eq!(result, DeleteFileResult::Ok);
        assert!(!state.file_data.contains_key(&0));
        assert!(state.file_contents.get(&(0, 0)).is_none());
        assert!(!state.file_owners.get(&test_principal).unwrap().contains(&0));
    }

    #[test]
    fn delete_nonexistent_file() {
        let mut state = State::default();
        let test_principal = Principal::from_text("2vxsx-fae").unwrap();

        // Try to delete a file that doesn't exist
        let result = delete_file(&mut state, test_principal, 42);

        // Should return NotFound
        assert_eq!(result, DeleteFileResult::NotFound);
    }

    #[test]
    fn anonymous_user_cannot_delete() {
        let mut state = State::default();

        // Try to delete a file as anonymous user
        let result = delete_file(&mut state, Principal::anonymous(), 42);

        // Should return NotAuthenticated
        assert_eq!(result, DeleteFileResult::NotAuthenticated);
    }

    #[test]
    fn wrong_user_cannot_delete() {
        let mut state = State::default();
        let test_principal1 = Principal::from_text("2vxsx-fae").unwrap();
        let test_principal2 = Principal::from_text("3vxsx-fae").unwrap();

        // Insert a file owned by principal1
        state.file_data.insert(
            0,
            File {
                metadata: FileMetadata {
                    file_name: "test_file.txt".to_string(),
                    requester_principal: test_principal1,
                    requested_at: 12345,
                    uploaded_at: Some(12345),
                },
                content: FileContent::Uploaded {
                    num_chunks: 1,
                    file_type: "txt".to_string(),
                },
            },
        );
        state.file_owners.insert(test_principal1, vec![0]);

        // Try to delete as principal2
        let result = delete_file(&mut state, test_principal2, 0);

        // Should return PermissionError
        assert_eq!(result, DeleteFileResult::PermissionError);
        assert!(state.file_data.contains_key(&0)); // File should still exist
    }
}

// pub fn delete_file(state: &mut State, caller: Principal, file_id: u64) -> FileSharingResponse {
//     // Check if the user owns this file
//     match state.file_owners.get_mut(&caller) {
//         Some(files) => {
//             if !files.contains(&file_id) {
//                 return FileSharingResponse::PermissionError;
//             }

//             // Remove the file from the user's owned files
//             files.retain(|&id| id != file_id);

//             // If the file is pending, need to remove its alias
//             if let Some(file) = state.file_data.get(&file_id) {
//                 if let FileContent::Pending { alias } = &file.content {
//                     state.file_alias_index.remove(alias);
//                 }
//             }

//             // Remove file shares for all users who have access to this file
//             for (_, shared_files) in state.file_shares.iter_mut() {
//                 shared_files.retain(|&id| id != file_id);
//             }

//             // Remove file chunks from storage
//             let file_data = state.file_data.get(&file_id).unwrap();
//             let num_chunks = match &file_data.content {
//                 FileContent::Pending { .. } => 0,
//                 FileContent::PartiallyUploaded { num_chunks, .. } => *num_chunks,
//                 FileContent::Uploaded { num_chunks, .. } => *num_chunks,
//             };

//             for chunk_id in 0..num_chunks {
//                 state.file_contents.remove(&(file_id, chunk_id));
//             }

//             // Finally remove the file data itself
//             state.file_data.remove(&file_id);

//             // Check if this file is part of any request group and remove it
//             for (_, group) in state.request_groups.iter_mut() {
//                 group.files.retain(|&id| id != file_id);
//             }

//             FileSharingResponse::Ok
//         }
//         None => FileSharingResponse::PermissionError,
//     }
// }

// #[cfg(test)]
// mod test {
//     use super::*;
//     use crate::{
//         api::{request_file, set_user_info, upload_file},
//         User,
//     };
//     use candid::Principal;

//     #[test]
//     fn delete_file_test() {
//         let mut state = State::default();
//         set_user_info(
//             &mut state,
//             Principal::anonymous(),
//             User {
//                 username: "John".to_string(),
//                 public_key: vec![1, 2, 3],
//             },
//         );

//         // Request a file
//         request_file(Principal::anonymous(), "test_file", &mut state);

//         // Upload the file
//         upload_file(
//             0,
//             vec![1, 2, 3],
//             "txt".to_string(),
//             // vec![1, 2, 3],
//             1,
//             &mut state,
//         )
//         .unwrap();

//         // Verify file exists
//         assert!(state.file_data.contains_key(&0));

//         // Delete the file
//         let result = delete_file(&mut state, Principal::anonymous(), 0);

//         // Verify result and file deletion
//         assert_eq!(result, FileSharingResponse::Ok);
//         assert!(!state.file_data.contains_key(&0));
//         assert!(!state
//             .file_owners
//             .get(&Principal::anonymous())
//             .unwrap()
//             .contains(&0));
//     }

//     #[test]
//     fn delete_file_permission_error() {
//         let mut state = State::default();
//         set_user_info(
//             &mut state,
//             Principal::anonymous(),
//             User {
//                 username: "John".to_string(),
//                 public_key: vec![1, 2, 3],
//             },
//         );

//         set_user_info(
//             &mut state,
//             Principal::from_slice(&[0, 1, 2]),
//             User {
//                 username: "Jane".to_string(),
//                 public_key: vec![3, 4, 5],
//             },
//         );

//         // Request a file as anonymous
//         request_file(Principal::anonymous(), "test_file", &mut state);

//         // Try to delete as another user
//         let result = delete_file(&mut state, Principal::from_slice(&[0, 1, 2]), 0);

//         // Verify permission error
//         assert_eq!(result, FileSharingResponse::PermissionError);
//         assert!(state.file_data.contains_key(&0));
//     }
// }
