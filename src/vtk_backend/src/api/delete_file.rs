use crate::{FileContent, State};
// use candid::Principal;
use candid::CandidType;
use serde::{Serialize, Deserialize};

#[derive(CandidType, Serialize, Deserialize, Debug, PartialEq, Eq)]
pub enum DeleteFileResult {
    Ok,
    NotFound,
}

pub fn delete_file(state: &mut State, file_id: u64) -> DeleteFileResult {
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
        DeleteFileResult::Ok
    } else {
        DeleteFileResult::NotFound
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::{File, FileContent, FileMetadata, State};

    #[test]
    fn delete_existing_file() {
        let mut state = State::default();

        // Insert a file manually
        state.file_data.insert(
            0,
            File {
                metadata: FileMetadata {
                    file_name: "test_file.txt".to_string(),
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

        // Delete the file
        let result = delete_file(&mut state, 0);

        // Check result and that file is gone
        assert_eq!(result, DeleteFileResult::Ok);
        assert!(!state.file_data.contains_key(&0));
        assert!(state.file_contents.get(&(0, 0)).is_none());
    }

    #[test]
    fn delete_nonexistent_file() {
        let mut state = State::default();

        // Try to delete a file that doesn't exist
        let result = delete_file(&mut state, 42);

        // Should return NotFound
        assert_eq!(result, DeleteFileResult::NotFound);
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
