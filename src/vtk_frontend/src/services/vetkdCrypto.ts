import * as vetkd from "ic-vetkd-utils";

// Type for the backend actor
export interface ActorType {
  // VetKey methods
  vetkd_public_key: () => Promise<{ Ok: Uint8Array } | { Err: string }>;
  vetkd_encrypted_key: (
    encryptionPublicKey: Uint8Array,
    fileId?: bigint
  ) => Promise<{ Ok: Uint8Array } | { Err: string }>;

  // File operations
  upload_file_atomic: (request: any) => Promise<bigint>;
  download_file: (fileId: bigint, chunkId: bigint) => Promise<any>;
  delete_file: (fileId: bigint) => Promise<any>;
  list_files: () => Promise<any[]>;
}

export class VetkdCryptoService {
  constructor(private actor: ActorType) {}

  /**
   * Encrypts file data using VetKey Identity-Based Encryption
   * @param data - File data to encrypt
   * @param userPrincipalBytes - User's principal as identity
   * @returns Encrypted data as Uint8Array
   */
  async encrypt(data: ArrayBuffer, userPrincipalBytes: Uint8Array): Promise<Uint8Array> {
    try {
      // Step 1: Get public key from backend
      const publicKeyResponse = await this.actor.vetkd_public_key();
      if (!publicKeyResponse || "Err" in publicKeyResponse) {
        throw new Error("Error getting public key from backend");
      }
      const publicKey = publicKeyResponse.Ok as Uint8Array;

      // Step 2: Generate random seed for encryption
      const seed = window.crypto.getRandomValues(new Uint8Array(32));

      // Step 3: Transform data to Uint8Array
      const encodedMessage = new Uint8Array(data);

      // Step 4: Encrypt using VetKey IBE
      const encryptedData = vetkd.IBECiphertext.encrypt(
        publicKey, // Backend's public key
        userPrincipalBytes, // User's principal as identity
        encodedMessage, // File data
        seed // Random seed
      );

      // Step 5: Return serialized encrypted data
      return encryptedData.serialize();
    } catch (error) {
      console.error("VetKey encryption error:", error);
      throw error;
    }
  }

  /**
   * Decrypts file data using VetKey Identity-Based Encryption
   * @param encryptedData - Encrypted file data
   * @param userPrincipalBytes - User's principal
   * @param fileId - File ID for key derivation (optional for own files)
   * @returns Decrypted data as Uint8Array
   */
  async decrypt(encryptedData: Uint8Array, userPrincipalBytes: Uint8Array, fileId?: bigint): Promise<Uint8Array> {
    try {
      // Step 1: Generate transport secret key for secure key exchange
      const seed = window.crypto.getRandomValues(new Uint8Array(32));
      const transportSecretKey = new vetkd.TransportSecretKey(seed);

      // Step 2: Get public key from backend
      const publicKeyResponse = await this.actor.vetkd_public_key();
      if (!publicKeyResponse || "Err" in publicKeyResponse) {
        throw new Error("Error getting public key from backend");
      }
      const publicKey = publicKeyResponse.Ok as Uint8Array;

      // Step 3: Get encrypted decryption key from backend
      const privateKeyResponse = await this.actor.vetkd_encrypted_key(transportSecretKey.public_key(), fileId);
      if (!privateKeyResponse || "Err" in privateKeyResponse) {
        throw new Error("Error getting encrypted key from backend");
      }
      const encryptedKey = privateKeyResponse.Ok as Uint8Array;

      // Step 4: Decrypt the key using transport secret
      const key = transportSecretKey.decrypt(
        encryptedKey,
        publicKey,
        userPrincipalBytes // Use caller's principal for own files
      );

      // Step 5: Decrypt the file data
      const ibeCiphertext = vetkd.IBECiphertext.deserialize(encryptedData);
      return ibeCiphertext.decrypt(key);
    } catch (error) {
      console.error("VetKey decryption error:", error);
      throw error;
    }
  }
}
