use crate::declarations::vetkd_system_api::{
    VETKD_SYSTEM_API, VetkdCurve, VetkdPublicKeyArgs, VetkdPublicKeyArgsKeyId,
};
use ic_cdk::update;
use candid::{CandidType, Deserialize};

#[derive(CandidType, Deserialize)]
pub enum VetkdPublicKeyResponse {
    Ok(Vec<u8>),
    Err(String),
}

#[update]
pub async fn vetkd_public_key() -> VetkdPublicKeyResponse {
    ic_cdk::println!("vetkd_public_key called");

    let args = VetkdPublicKeyArgs {
        key_id: VetkdPublicKeyArgsKeyId {
            name: "insecure_test_key_1".to_string(),
            curve: VetkdCurve::Bls12381G2,
        },
        derivation_path: vec![],
        canister_id: None,
    };

    match VETKD_SYSTEM_API.vetkd_public_key(args).await {
        Ok((result,)) => {
            ic_cdk::println!("Returning public key: {:?}", result.public_key);
            VetkdPublicKeyResponse::Ok(result.public_key.to_vec())
        }
        Err(e) => {
            ic_cdk::println!("VetKD call failed: {:?}", e);
            VetkdPublicKeyResponse::Err(format!("VetKD call failed: {:?}", e))
        }
    }
} 