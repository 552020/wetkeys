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
    console.log("[VetkdCryptoService.encrypt] called", {
      dataType: typeof data,
      userPrincipalBytesType: typeof userPrincipalBytes,
      data,
      userPrincipalBytes,
    });
    try {
      // Step 1: Get public key from backend
      console.log("[VetkdCryptoService.encrypt] Step 1: Getting public key");
      const publicKeyResponse = await this.actor.vetkd_public_key();
      console.log("[VetkdCryptoService.encrypt] Step 1: publicKeyResponse", publicKeyResponse);
      if (!publicKeyResponse || "Err" in publicKeyResponse) {
        throw new Error("Error getting public key from backend");
      }
      const publicKey = publicKeyResponse.Ok as Uint8Array;
      console.log("[VetkdCryptoService.encrypt] Step 1: publicKey", publicKey);

      // Step 2: Generate random seed for encryption
      const seed = window.crypto.getRandomValues(new Uint8Array(32));
      console.log("[VetkdCryptoService.encrypt] Step 2: seed", seed);

      // Step 3: Transform data to Uint8Array
      const encodedMessage = new Uint8Array(data);
      console.log("[VetkdCryptoService.encrypt] Step 3: encodedMessage", encodedMessage);

      // Step 4: Encrypt using VetKey IBE
      console.log("[VetkdCryptoService.encrypt] Step 4: Calling IBECiphertext.encrypt", {
        publicKey,
        userPrincipalBytes,
        encodedMessage,
        seed,
      });
      const encryptedData = vetkd.IBECiphertext.encrypt(
        publicKey, // Backend's public key
        userPrincipalBytes, // User's principal as identity
        encodedMessage, // File data
        seed // Random seed
      );
      console.log("[VetkdCryptoService.encrypt] Step 4: encryptedData", encryptedData);

      // Step 5: Return serialized encrypted data
      const serialized = encryptedData.serialize();
      console.log("[VetkdCryptoService.encrypt] Step 5: serialized", serialized);
      return serialized;
    } catch (error) {
      console.error("[VetkdCryptoService.encrypt] VetKey encryption error:", error);
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
    console.log("[VetkdCryptoService.decrypt] called", {
      encryptedDataType: typeof encryptedData,
      userPrincipalBytesType: typeof userPrincipalBytes,
      fileId,
      encryptedData,
      userPrincipalBytes,
    });
    try {
      // Step 1: Generate transport secret key for secure key exchange
      const seed = window.crypto.getRandomValues(new Uint8Array(32));
      console.log("[VetkdCryptoService.decrypt] Step 1: seed", seed);
      const transportSecretKey = new vetkd.TransportSecretKey(seed);
      console.log("[VetkdCryptoService.decrypt] Step 1: transportSecretKey", transportSecretKey);

      // Step 2: Get public key from backend
      console.log("[VetkdCryptoService.decrypt] Step 2: Getting public key");
      const publicKeyResponse = await this.actor.vetkd_public_key();
      console.log("[VetkdCryptoService.decrypt] Step 2: publicKeyResponse", publicKeyResponse);
      if (!publicKeyResponse || "Err" in publicKeyResponse) {
        throw new Error("Error getting public key from backend");
      }
      const publicKey = publicKeyResponse.Ok as Uint8Array;
      console.log("[VetkdCryptoService.decrypt] Step 2: publicKey", publicKey);

      // Step 3: Get encrypted decryption key from backend
      let pubkeyArg = transportSecretKey.public_key();
      if (!(pubkeyArg instanceof Uint8Array)) {
        pubkeyArg = new Uint8Array(pubkeyArg);
      }
      console.log("[VetkdCryptoService.decrypt] Step 3: pubkeyArg", pubkeyArg);
      const privateKeyResponse = await this.actor.vetkd_encrypted_key(pubkeyArg, fileId);
      console.log("[VetkdCryptoService.decrypt] Step 3: privateKeyResponse", privateKeyResponse);
      if (!privateKeyResponse || "Err" in privateKeyResponse) {
        throw new Error("Error getting encrypted key from backend");
      }
      const encryptedKey = privateKeyResponse.Ok as Uint8Array;
      console.log("[VetkdCryptoService.decrypt] Step 3: encryptedKey", encryptedKey);

      // Step 4: Decrypt the key using transport secret
      console.log("[VetkdCryptoService.decrypt] Step 4: Calling transportSecretKey.decrypt", {
        encryptedKey,
        publicKey,
        userPrincipalBytes,
      });
      const key = transportSecretKey.decrypt(
        encryptedKey,
        publicKey,
        userPrincipalBytes // Use caller's principal for own files
      );
      console.log("[VetkdCryptoService.decrypt] Step 4: key", key);

      // Step 5: Decrypt the file data
      console.log("[VetkdCryptoService.decrypt] Step 5: Calling IBECiphertext.deserialize", { encryptedData });
      const ibeCiphertext = vetkd.IBECiphertext.deserialize(encryptedData);
      console.log("[VetkdCryptoService.decrypt] Step 5: ibeCiphertext", ibeCiphertext);
      const decrypted = ibeCiphertext.decrypt(key);
      console.log("[VetkdCryptoService.decrypt] Step 5: decrypted", decrypted);
      return decrypted;
    } catch (error) {
      console.error("[VetkdCryptoService.decrypt] VetKey decryption error:", error);
      throw error;
    }
  }
}
