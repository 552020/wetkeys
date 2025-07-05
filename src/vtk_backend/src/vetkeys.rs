use candid::{CandidType, Principal};
use encrypted_maps::{EncryptedMaps, EncryptedMapsError};
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use vetkd_utils::{VetkdUtils, VetkdUtilsError};

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct VetKeysConfig {
    pub derivation_id: Vec<u8>,
    pub key_name: String,
    pub encryption_public_key: Vec<u8>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct EncryptedFileData {
    pub file_id: u64,
    pub encrypted_content: Vec<u8>,
    pub file_type: String,
    pub owner_principal: Principal,
    pub shared_with: Vec<Principal>,
    pub vet_keys_config: VetKeysConfig,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub enum VetKeysError {
    #[serde(rename = "derivation_failed")]
    DerivationFailed,
    #[serde(rename = "encryption_failed")]
    EncryptionFailed,
    #[serde(rename = "decryption_failed")]
    DecryptionFailed,
    #[serde(rename = "permission_denied")]
    PermissionDenied,
    #[serde(rename = "file_not_found")]
    FileNotFound,
}

pub struct VetKeysManager {
    vetkd_utils: VetkdUtils,
    encrypted_maps: EncryptedMaps,
}

impl VetKeysManager {
    pub fn new() -> Self {
        Self {
            vetkd_utils: VetkdUtils::new(),
            encrypted_maps: EncryptedMaps::new(),
        }
    }

    /// Generate a new vetKeys configuration for file encryption
    pub async fn generate_file_keys(
        &self,
        file_id: u64,
        owner_principal: Principal,
    ) -> Result<VetKeysConfig, VetKeysError> {
        let derivation_id = self.generate_derivation_id(file_id, owner_principal);
        let key_name = format!("vtk_file_{}", file_id);
        
        // Get the public key for this derivation
        let public_key_result = self
            .vetkd_utils
            .get_public_key(derivation_id.clone(), key_name.clone())
            .await;

        match public_key_result {
            Ok(public_key) => Ok(VetKeysConfig {
                derivation_id,
                key_name,
                encryption_public_key: public_key,
            }),
            Err(_) => Err(VetKeysError::DerivationFailed),
        }
    }

    /// Encrypt file content using vetKeys
    pub async fn encrypt_file(
        &self,
        file_content: Vec<u8>,
        file_id: u64,
        owner_principal: Principal,
        shared_principals: Vec<Principal>,
    ) -> Result<EncryptedFileData, VetKeysError> {
        let vet_keys_config = self
            .generate_file_keys(file_id, owner_principal)
            .await?;

        // Encrypt the file content
        let encrypted_content = self
            .encrypted_maps
            .encrypt(
                file_content,
                vet_keys_config.derivation_id.clone(),
                vet_keys_config.key_name.clone(),
                shared_principals.clone(),
            )
            .await
            .map_err(|_| VetKeysError::EncryptionFailed)?;

        Ok(EncryptedFileData {
            file_id,
            encrypted_content,
            file_type: "application/octet-stream".to_string(),
            owner_principal,
            shared_with: shared_principals,
            vet_keys_config,
        })
    }

    /// Decrypt file content using vetKeys
    pub async fn decrypt_file(
        &self,
        encrypted_file: &EncryptedFileData,
        requester_principal: Principal,
    ) -> Result<Vec<u8>, VetKeysError> {
        // Check if the requester has permission to decrypt
        if encrypted_file.owner_principal != requester_principal
            && !encrypted_file.shared_with.contains(&requester_principal)
        {
            return Err(VetKeysError::PermissionDenied);
        }

        // Decrypt the file content
        let decrypted_content = self
            .encrypted_maps
            .decrypt(
                encrypted_file.encrypted_content.clone(),
                encrypted_file.vet_keys_config.derivation_id.clone(),
                encrypted_file.vet_keys_config.key_name.clone(),
            )
            .await
            .map_err(|_| VetKeysError::DecryptionFailed)?;

        Ok(decrypted_content)
    }

    /// Share a file with additional principals
    pub async fn share_file(
        &self,
        encrypted_file: &mut EncryptedFileData,
        new_principals: Vec<Principal>,
        owner_principal: Principal,
    ) -> Result<(), VetKeysError> {
        if encrypted_file.owner_principal != owner_principal {
            return Err(VetKeysError::PermissionDenied);
        }

        // Add new principals to the shared list
        for principal in new_principals {
            if !encrypted_file.shared_with.contains(&principal) {
                encrypted_file.shared_with.push(principal);
            }
        }

        Ok(())
    }

    /// Generate a unique derivation ID for a file
    fn generate_derivation_id(&self, file_id: u64, owner_principal: Principal) -> Vec<u8> {
        let mut derivation_id = Vec::new();
        derivation_id.extend_from_slice(&file_id.to_le_bytes());
        derivation_id.extend_from_slice(owner_principal.as_slice());
        derivation_id
    }
}

impl Default for VetKeysManager {
    fn default() -> Self {
        Self::new()
    }
} 