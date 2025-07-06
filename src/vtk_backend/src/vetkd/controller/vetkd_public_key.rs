use crate::declarations::vetkd_system_api::{
    vetkd_system_api, VetkdCurve, VetkdPublicKeyArgs, VetkdPublicKeyArgsKeyId,
};
use ic_cdk::update;

#[update]
pub async fn vetkd_public_key() -> Result<Vec<u8>, String> {
    let args = VetkdPublicKeyArgs {
        key_id: VetkdPublicKeyArgsKeyId {
            name: "insecure_test_key_1".to_string(),
            curve: VetkdCurve::Bls12381G2,
        },
        derivation_path: vec![],
        canister_id: None,
    };

    let (result,) = vetkd_system_api
        .vetkd_public_key(args)
        .await
        .map_err(|_| "Failed to retrieve public key from VetKey System API".to_string())?;

    Ok(result.public_key.to_vec())
} 