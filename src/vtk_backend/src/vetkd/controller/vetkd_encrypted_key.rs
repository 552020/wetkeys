use crate::declarations::vetkd_system_api::{
    vetkd_system_api, VetkdCurve, VetkdDeriveEncryptedKeyArgs, VetkdDeriveEncryptedKeyArgsKeyId,
};
use crate::with_state;
use ic_cdk::update;
use serde_bytes::ByteBuf;

#[update]
pub async fn vetkd_encrypted_key(
    encryption_public_key: Vec<u8>,
    file_id: Option<u64>,
) -> Result<Vec<u8>, String> {
    // Determine derivation ID based on file ownership
    let derivation_id = if let Some(id) = file_id {
        // Use file owner's principal for shared files
        let principal = with_state(|state| {
            state
                .file_data
                .get(&id)
                .map(|file| file.metadata.requester_principal.as_slice().to_vec())
                .ok_or_else(|| "File not found".to_string())
        })?;
        principal
    } else {
        // Use caller's principal for own files
        let caller = ic_cdk::api::caller().as_slice().to_vec();
        caller
    };

    let args = VetkdDeriveEncryptedKeyArgs {
        key_id: VetkdDeriveEncryptedKeyArgsKeyId {
            name: "insecure_test_key_1".to_string(),
            curve: VetkdCurve::Bls12381G2,
        },
        derivation_path: vec![],
        derivation_id: ByteBuf::from(derivation_id),
        encryption_public_key: ByteBuf::from(encryption_public_key),
    };

    let (result,) = vetkd_system_api
        .vetkd_derive_encrypted_key(args)
        .await
        .map_err(|_| "Failed to derive encrypted key from VetKey System API".to_string())?;

    Ok(result.encrypted_key.to_vec())
} 