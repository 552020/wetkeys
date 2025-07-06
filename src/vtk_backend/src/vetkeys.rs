use candid::{CandidType, Principal};
use ic_cdk::api::call::call_with_payment;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct VetkdPublicKeyRequest {
    pub canister_id: Option<Principal>,
    pub derivation_path: Vec<Vec<u8>>,
    pub key_id: VetkdSystemKeyId,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct VetkdPublicKeyResponse {
    pub public_key: Vec<u8>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct VetkdDeriveKeyRequest {
    pub public_key_derivation_path: Vec<Vec<u8>>,
    pub key_id: VetkdSystemKeyId,
    pub encryption_public_key: Vec<u8>,
    pub derivation_id: Vec<u8>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct VetkdDeriveKeyResponse {
    pub derived_key: Vec<u8>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum VetkdSystemKeyId {
    #[serde(rename = "bls12381_g1")]
    Bls12381G1,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct VetKeyInfo {
    pub public_key: Vec<u8>,
    pub derived_key: Vec<u8>,
    pub encryption_key: Vec<u8>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct EncryptedFileData {
    pub encrypted_content: Vec<u8>,
    pub file_owners: Vec<Principal>,
    pub encryption_metadata: HashMap<Principal, Vec<u8>>, // Principal -> encrypted key
}

pub struct VetKeyService;

impl VetKeyService {
    /// Get the vetKey public key for a user
    pub async fn get_public_key(_user_principal: Principal) -> Result<Vec<u8>, String> {
        let request = VetkdPublicKeyRequest {
            canister_id: None,
            derivation_path: vec![b"vtk_file_encryption".to_vec()],
            key_id: VetkdSystemKeyId::Bls12381G1,
        };

        let response: (VetkdPublicKeyResponse,) = call_with_payment(
            Principal::management_canister(),
            "vetkd_public_key",
            (request,),
            0,
        )
        .await
        .map_err(|e| format!("Failed to get public key: {:?}", e))?;

        Ok(response.0.public_key)
    }

    /// Derive an encryption key for a specific file and user
    pub async fn derive_encryption_key(
        user_principal: Principal,
        file_id: u64,
    ) -> Result<Vec<u8>, String> {
        let request = VetkdDeriveKeyRequest {
            public_key_derivation_path: vec![b"vtk_file_encryption".to_vec()],
            key_id: VetkdSystemKeyId::Bls12381G1,
            encryption_public_key: Self::get_public_key(user_principal).await?,
            derivation_id: format!("file_{}", file_id).into_bytes(),
        };

        let response: (VetkdDeriveKeyResponse,) = call_with_payment(
            Principal::management_canister(),
            "vetkd_derive_key",
            (request,),
            0,
        )
        .await
        .map_err(|e| format!("Failed to derive key: {:?}", e))?;

        Ok(response.0.derived_key)
    }

    /// Encrypt file content for multiple owners
    pub async fn encrypt_file_for_owners(
        file_content: Vec<u8>,
        file_id: u64,
        owners: Vec<Principal>,
    ) -> Result<EncryptedFileData, String> {
        let mut encryption_metadata = HashMap::new();
        let encrypted_content = file_content;

        // Encrypt for each owner
        for owner in &owners {
            let encryption_key = Self::derive_encryption_key(*owner, file_id).await?;
            
            // Simple XOR encryption for demonstration
            // In production, use a proper encryption algorithm like AES
            let encrypted_key = Self::xor_encrypt(&encrypted_content, &encryption_key);
            encryption_metadata.insert(*owner, encrypted_key);
        }

        Ok(EncryptedFileData {
            encrypted_content,
            file_owners: owners,
            encryption_metadata,
        })
    }

    /// Decrypt file content for a specific user
    pub async fn decrypt_file_for_user(
        encrypted_data: &EncryptedFileData,
        user_principal: Principal,
        file_id: u64,
    ) -> Result<Vec<u8>, String> {
        // Check if user is an owner
        if !encrypted_data.file_owners.contains(&user_principal) {
            return Err("User is not an owner of this file".to_string());
        }

        // Get the encrypted key for this user
        let encrypted_key = encrypted_data
            .encryption_metadata
            .get(&user_principal)
            .ok_or("No encryption key found for user")?;

        // Derive the decryption key
        let decryption_key = Self::derive_encryption_key(user_principal, file_id).await?;

        // Decrypt the content
        let decrypted_content = Self::xor_decrypt(encrypted_key, &decryption_key);

        Ok(decrypted_content)
    }

    /// Simple XOR encryption (for demonstration - use proper encryption in production)
    fn xor_encrypt(data: &[u8], key: &[u8]) -> Vec<u8> {
        data.iter()
            .zip(key.iter().cycle())
            .map(|(d, k)| d ^ k)
            .collect()
    }

    /// Simple XOR decryption (for demonstration - use proper decryption in production)
    fn xor_decrypt(data: &[u8], key: &[u8]) -> Vec<u8> {
        Self::xor_encrypt(data, key) // XOR is symmetric
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use candid::Principal;

    #[test]
    fn test_xor_encryption() {
        let data = b"Hello, World!";
        let key = b"secret_key_123";
        
        let encrypted = VetKeyService::xor_encrypt(data, key);
        let decrypted = VetKeyService::xor_decrypt(&encrypted, key);
        
        assert_eq!(data, decrypted.as_slice());
    }
} 