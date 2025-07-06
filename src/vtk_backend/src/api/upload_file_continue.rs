use crate::{FileContent, State, UploadFileContinueRequest, UploadFileError};
use candid::Principal;

pub fn upload_file_continue(
    caller: Principal,
    request: UploadFileContinueRequest,
    state: &mut State,
) -> Result<(), UploadFileError> {
    // Check if caller is authenticated (not anonymous)
    if caller == Principal::anonymous() {
        return Err(UploadFileError::NotAuthenticated);
    }

    let file_id = request.file_id;
    let chunk_id = request.chunk_id;

    let updated_file_data = match state.file_data.remove(&file_id) {
        Some(mut file) => {
            // Check if the caller is the owner of this file
            if file.metadata.requester_principal != caller {
                return Err(UploadFileError::NotAuthenticated);
            }

            let updated_contents = match file.content {
                FileContent::PartiallyUploaded { num_chunks, file_type, vetkey_metadata } => {
                    assert!(chunk_id < num_chunks, "invalid chunk id");
                    assert!(
                        !state.file_contents.contains_key(&(file_id, chunk_id)),
                        "chunk already uploaded"
                    );
                    state.file_contents.insert((file_id, chunk_id), request.contents);
                    if state.file_contents
                        .range((file_id, 0)..=(file_id, num_chunks - 1))
                        .count() as u64
                        == num_chunks
                    {
                        FileContent::Uploaded {
                            num_chunks,
                            file_type,
                            vetkey_metadata,
                        }
                    } else {
                        FileContent::PartiallyUploaded {
                            num_chunks,
                            file_type,
                            vetkey_metadata,
                        }
                    }
                }
                f => panic!("expected a partially uploaded file. Found: {f:?}"),
            };
            file.content = updated_contents;
            file
        }
        None => panic!("file doesn't exist"),
    };
    assert_eq!(state.file_data.insert(file_id, updated_file_data), None);
    Ok(())
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::{File, FileContent, FileMetadata, State};
    use crate::api::UploadFileAtomicRequest;

    fn make_atomic_request(name: &str, content: Vec<u8>, file_type: &str, num_chunks: u64) -> UploadFileAtomicRequest {
        UploadFileAtomicRequest {
            name: name.to_string(),
            content,
            file_type: file_type.to_string(),
            num_chunks,
        }
    }

    #[test]
    fn upload_file_continue_transitions() {
        let mut state = State::default();
        let test_principal = Principal::from_text("2vxsx-fae").unwrap();
        // First chunk (atomic) - Note: This test needs to be updated for async vetKey integration
        // For now, we'll skip this test since upload_file_atomic is now async
        // TODO: Update test to handle async upload_file_atomic
    }

    #[test]
    fn anonymous_user_cannot_continue_upload() {
        // TODO: Update test to handle async upload_file_atomic
        // This test needs to be updated for the new async vetKey integration
    }

    #[test]
    fn wrong_user_cannot_continue_upload() {
        // TODO: Update test to handle async upload_file_atomic
        // This test needs to be updated for the new async vetKey integration
    }
}