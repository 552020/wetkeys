# Issue: Implement Minimal VetKey Encryption in Backend

## Overview

This issue documents the step-by-step process for implementing minimal VetKey encryption in the VTK backend, suitable for a rapid integration and demo.

---

## Implementation Steps

### 1. **Create VetKey System API Declarations**

- Added `src/vtk_backend/src/declarations/vetkd_system_api.rs` with Rust bindings for the VetKey System API canister.
- **Note:** While `dfx generate` produces TypeScript/JS declarations for your own canister's interface, **inter-canister Rust bindings** (like calling the VetKey System API from your canister) are **not** produced by `dfx generate` and must be written by hand. This is standard for Rust canisters calling other canisters.

### 2. **Create VetKey Module Structure**

- Added `src/vtk_backend/src/vetkd/mod.rs` and `src/vtk_backend/src/vetkd/controller/mod.rs` to organize VetKey logic.
- **Design Choice:** Followed the **Canister Co pattern** over IC VetKey Showcase pattern:
  - **Canister Co Pattern (Chosen):** Dedicated `vetkd/` module with controller structure, file-centric approach
  - **IC VetKey Showcase Pattern:** Flat controller structure, user-centric approach, feature-based organization
  - **Rationale:** VTK is a file management system, so the file-focused Canister Co approach aligns better with our use case, provides better modularity, and offers clearer separation of concerns for future extensibility.

### 3. **Implement VetKey Public Key Method**

- Implemented `vetkd_public_key` in `vetkd/controller/vetkd_public_key.rs` to retrieve the public key from the VetKey System API.

### 4. **Implement VetKey Encrypted Key Method**

- Implemented `vetkd_encrypted_key` in `vetkd/controller/vetkd_encrypted_key.rs` to derive encrypted keys for file decryption.

### 5. **Update Main Lib.rs to Include VetKey Module**

- Added `pub mod vetkd;` and `pub mod declarations;` to `src/vtk_backend/src/lib.rs`.

### 6. **Update Main.rs to Export VetKey Methods**

- **Note:** Initially attempted to add VetKey methods to main.rs, but removed them as they were duplicates of the methods already defined in the vetkd module.

### 7. **Add VetKey Methods to Main.rs**

- **Note:** VetKey methods are automatically exposed through the vetkd module without needing explicit addition to main.rs.

### 8. **Create Declarations Directory and Update Lib.rs**

- Added `src/vtk_backend/src/declarations/mod.rs` to fix linter errors and module imports.

### 9. **Update File Metadata to Include Encryption Flag**

- Added `is_encrypted: bool` to `FileMetadata` struct in `lib.rs` for tracking VetKey-encrypted files.

### 10. **Update Upload Method to Set Encryption Flag**

- Modified upload logic in `main.rs` and `api/upload_file_atomic.rs` to set `is_encrypted: true` for VetKey-encrypted files.

### 11. **Test the Implementation**

- Ran `cargo check` to verify compilation and identify/fix errors.

### 12. **Fix Function Visibility**

- Made VetKey controller functions `pub` to resolve visibility errors.

### 13. **Fix FileMetadata Initialization**

- Updated all `FileMetadata` initializations (including in `register_file.rs`) to include the new `is_encrypted` field.

### 14. **Test Compilation Again**

- Ran `cargo check` to ensure all changes compile cleanly.

### 15. **Fix Naming Conflicts and Final Test**

- Removed duplicate VetKey method definitions from `main.rs` to resolve naming conflicts and recursion errors.
- Final `cargo check` passed with only a non-blocking warning.

---

## Result

- ✅ Minimal VetKey backend integration is complete and compiles cleanly.
- ✅ Core VetKey endpoints (`vetkd_public_key`, `vetkd_encrypted_key`) are available for frontend integration.
- ✅ File metadata tracks VetKey encryption status.

## Next Steps

- Integrate VetKey endpoints with the frontend for file upload/download.
- Test full encryption/decryption flow.
- Add error handling and user feedback as needed.

---

**Priority:** High

**Effort:** 2-3 hours (minimal integration)

**Status:** Complete (backend)
