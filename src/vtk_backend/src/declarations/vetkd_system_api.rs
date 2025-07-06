use candid::{CandidType, Deserialize, Principal};
use ic_cdk::api::call::CallResult;
use serde_bytes::ByteBuf;

// VetKey System API Canister ID (mainnet)
pub const CANISTER_ID: Principal = Principal::from_slice(&[255, 255, 255, 255, 255, 144, 0, 4, 1, 1]); // umunu-kh777-77774-qaaca-cai

// VetKey System API client
pub struct VetkdSystemApi(pub Principal);

impl VetkdSystemApi {
    pub async fn vetkd_public_key(&self, arg0: VetkdPublicKeyArgs) -> CallResult<(VetkdPublicKeyResult,)> {
        ic_cdk::call(self.0, "vetkd_public_key", (arg0,)).await
    }

    pub async fn vetkd_derive_encrypted_key(
        &self,
        arg0: VetkdDeriveEncryptedKeyArgs,
    ) -> CallResult<(VetkdDeriveEncryptedKeyResult,)> {
        ic_cdk::call(self.0, "vetkd_derive_encrypted_key", (arg0,)).await
    }
}

// Public instance of VetKey System API
pub const vetkd_system_api: VetkdSystemApi = VetkdSystemApi(CANISTER_ID);

// VetKey Public Key Types
#[derive(Debug, CandidType, Deserialize)]
pub enum VetkdCurve {
    #[serde(rename = "bls12_381_g2")]
    Bls12381G2,
}

#[derive(Debug, CandidType, Deserialize)]
pub struct VetkdPublicKeyArgsKeyId {
    pub name: String,
    pub curve: VetkdCurve,
}

#[derive(Debug, CandidType, Deserialize)]
pub struct VetkdPublicKeyArgs {
    pub key_id: VetkdPublicKeyArgsKeyId,
    pub canister_id: Option<Principal>,
    pub derivation_path: Vec<ByteBuf>,
}

#[derive(Debug, CandidType, Deserialize)]
pub struct VetkdPublicKeyResult {
    pub public_key: ByteBuf,
}

// VetKey Encrypted Key Types
#[derive(Debug, CandidType, Deserialize)]
pub struct VetkdDeriveEncryptedKeyArgsKeyId {
    pub name: String,
    pub curve: VetkdCurve,
}

#[derive(Debug, CandidType, Deserialize)]
pub struct VetkdDeriveEncryptedKeyArgs {
    pub key_id: VetkdDeriveEncryptedKeyArgsKeyId,
    pub derivation_path: Vec<ByteBuf>,
    pub derivation_id: ByteBuf,
    pub encryption_public_key: ByteBuf,
}

#[derive(Debug, CandidType, Deserialize)]
pub struct VetkdDeriveEncryptedKeyResult {
    pub encrypted_key: ByteBuf,
} 