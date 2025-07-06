# VetKey Files Analysis: Complete Project File Structure

## Overview

This document provides a comprehensive list of all files relevant to the VetKey system in the `ic-vetkey-showcase` project. The files are organized by category and include both source code and configuration files.

## 📁 Configuration Files

### Project Configuration

- **`dfx.json`** - Internet Computer deployment configuration

  - Defines canisters (backend/frontend)
  - Sets up build and deployment settings
  - Configures Candid interface generation

- **`package.json`** - Frontend dependencies and scripts

  - Includes `@dfinity/vetkeys: ^0.1.0` dependency
  - Contains build and development scripts
  - Lists all frontend dependencies

- **`src/backend/Cargo.toml`** - Backend Rust dependencies

  - Includes `ic-vetkeys` dependency from GitHub
  - Specifies Rust edition and crate type
  - Lists all backend dependencies

- **`Cargo.lock`** - Rust dependency lock file
  - Locks `ic-vetkeys` to specific commit (`25c240e`)
  - Ensures reproducible builds

### Build Scripts

- **`scripts/build.sh`** - Build automation script
  - Compiles Rust backend to WASM
  - Extracts Candid interface
  - Generates TypeScript bindings

## 🔧 Backend Files (Rust)

### Core VetKey Infrastructure

- **`src/backend/src/vetkey.rs`** - Core VetKey functionality

  - Root public key management
  - VetKD key ID configuration
  - Transport key creation utilities

- **`src/backend/src/lib.rs`** - Main backend module
  - Exports Candid interface
  - Includes VetKey module

### VetKey API Controllers

- **`src/backend/src/controller/get_root_public_key.rs`** - Root public key endpoint

  - Provides canister's root public key
  - Used for IBE encryption

- **`src/backend/src/controller/get_user_key.rs`** - User key derivation endpoint
  - Derives encrypted VetKeys for users
  - Uses VetKD system for key derivation

### Message System (VetKey + IBE)

- **`src/backend/src/message/message_manager.rs`** - Message storage and management

  - Stores both IBE and VetKey encrypted messages
  - Manages message metadata and access control

- **`src/backend/src/message/controller/message_send.rs`** - Message sending endpoint

  - Receives dual-encrypted messages from frontend
  - Stores both recipient (IBE) and sender (VetKey) versions

- **`src/backend/src/message/controller/message_list_received.rs`** - Received messages endpoint

  - Returns IBE-encrypted messages for recipients

- **`src/backend/src/message/controller/message_list_sent.rs`** - Sent messages endpoint

  - Returns VetKey-encrypted messages for senders

- **`src/backend/src/message/controller/mod.rs`** - Message controller module exports

- **`src/backend/src/message/mod.rs`** - Message module exports

### Encrypted Notes (VetKey Only)

- **`src/backend/src/encrypted_notes/notes_manager.rs`** - Notes storage and management

  - Stores VetKey-encrypted notes
  - Principal-based access control

- **`src/backend/src/encrypted_notes/controller/notes_save.rs`** - Note saving endpoint

  - Receives VetKey-encrypted notes from frontend

- **`src/backend/src/encrypted_notes/controller/notes_get.rs`** - Note retrieval endpoint

  - Returns encrypted notes to owners

- **`src/backend/src/encrypted_notes/controller/notes_has.rs`** - Note existence check

  - Checks if user has stored notes

- **`src/backend/src/encrypted_notes/controller/notes_delete.rs`** - Note deletion endpoint

  - Removes encrypted notes

- **`src/backend/src/encrypted_notes/controller/mod.rs`** - Notes controller module exports

- **`src/backend/src/encrypted_notes/mod.rs`** - Notes module exports

### Timelock System (IBE + VetKey)

- **`src/backend/src/timelock/timelock_manager.rs`** - Timelock management

  - Stores IBE-encrypted time-locked messages
  - Handles time-based decryption logic
  - Uses VetKey for canister-side decryption

- **`src/backend/src/timelock/controller/timelock_create.rs`** - Timelock creation endpoint

  - Receives IBE-encrypted time-locked messages

- **`src/backend/src/timelock/controller/timelock_list.rs`** - Timelock listing endpoint

  - Returns list of all timelocks

- **`src/backend/src/timelock/controller/timelock_open.rs`** - Timelock opening endpoint

  - Decrypts messages after time expiration

- **`src/backend/src/timelock/controller/mod.rs`** - Timelock controller module exports

- **`src/backend/src/timelock/mod.rs`** - Timelock module exports

### Authentication

- **`src/backend/src/auth.rs`** - Authentication utilities
  - Principal-based authentication
  - Anonymous user handling

## 🎨 Frontend Files (TypeScript/React)

### Core VetKey Hooks

- **`src/frontend/hooks/use-get-root-public-key.tsx`** - Root public key hook

  - Fetches canister's root public key
  - Caches key for IBE encryption

- **`src/frontend/hooks/use-get-user-key.tsx`** - User key hook
  - Derives and decrypts user VetKeys
  - Manages VetKey lifecycle

### State Management

- **`src/frontend/state/root-key.tsx`** - Root key state store

  - Persists root public key
  - Provides key access utilities

- **`src/frontend/state/user-keys.tsx`** - User keys state store

  - Manages multiple user VetKeys
  - Persists keys locally

- **`src/frontend/state/identity.tsx`** - User identity management
  - Handles user authentication
  - Manages user principals

### Message System (VetKey + IBE)

- **`src/frontend/message/hooks/use-message-send.tsx`** - Message sending hook

  - **PRINCIPAL FILE** - Main encryption entry point
  - Implements dual encryption (IBE + VetKey)
  - Handles message encryption and sending

- **`src/frontend/message/hooks/use-message-decrypt-received.tsx`** - Received message decryption

  - Decrypts IBE-encrypted messages
  - Uses recipient's VetKey

- **`src/frontend/message/hooks/use-message-decrypt-sent.tsx`** - Sent message decryption

  - Decrypts VetKey-encrypted messages
  - Uses sender's VetKey

- **`src/frontend/message/hooks/use-message-list-received.tsx`** - Received messages hook

  - Fetches received messages from backend

- **`src/frontend/message/hooks/use-message-list-sent.tsx`** - Sent messages hook

  - Fetches sent messages from backend

- **`src/frontend/message/components/message-card.tsx`** - Message UI component
  - Displays messages and handles decryption
  - Manages message visibility

### Encrypted Notes (VetKey Only)

- **`src/frontend/encrypted-notes/hooks/use-notes-save.tsx`** - Note saving hook

  - Encrypts notes using user's VetKey
  - Sends encrypted notes to backend

- **`src/frontend/encrypted-notes/hooks/use-notes-decrypt.tsx`** - Note decryption hook

  - Decrypts notes using user's VetKey

- **`src/frontend/encrypted-notes/hooks/use-notes-get.tsx`** - Note retrieval hook

  - Fetches encrypted notes from backend

- **`src/frontend/encrypted_notes/hooks/use-notes-has.tsx`** - Note existence hook

  - Checks if user has stored notes

- **`src/frontend/encrypted-notes/components/encrypted-notes-card.tsx`** - Notes UI component
  - Provides note creation and viewing interface

### Timelock System (IBE + VetKey)

- **`src/frontend/timelock/hooks/use-timelock-create.tsx`** - Timelock creation hook

  - Encrypts messages with time-based IBE
  - Creates time-locked messages

- **`src/frontend/timelock/hooks/use-timelock-list.tsx`** - Timelock listing hook

  - Fetches available timelocks

- **`src/frontend/timelock/hooks/use-timelock-open.tsx`** - Timelock opening hook

  - Opens expired timelocks

- **`src/frontend/timelock/components/timelock-create-card.tsx`** - Timelock creation UI

  - Interface for creating time-locked messages

- **`src/frontend/timelock/components/timelock-list-card.tsx`** - Timelock listing UI
  - Displays available timelocks

### Application Structure

- **`src/frontend/main.tsx`** - Application entry point

  - Sets up React app with providers
  - Configures routing and state management

- **`src/frontend/backend-actor.tsx`** - Backend communication

  - Manages Internet Computer actor
  - Handles backend API calls

- **`src/frontend/routes/__root.tsx`** - Root layout component

  - Main application layout
  - Includes navigation and authentication

- **`src/frontend/routes/index.tsx`** - Home page

  - Overview of VetKey features
  - Navigation to different showcases

- **`src/frontend/routes/encrypted-notes.tsx`** - Notes page route
- **`src/frontend/routes/message.tsx`** - Messages page route
- **`src/frontend/routes/timelock.tsx`** - Timelock page route

### UI Components

- **`src/frontend/components/login-card.tsx`** - Authentication component

  - User login interface
  - VetKey derivation status

- **`src/frontend/components/header.tsx`** - Application header
- **`src/frontend/components/nav-buttons.tsx`** - Navigation buttons
- **`src/frontend/components/home-button-card.tsx`** - Feature cards

### Utilities

- **`src/frontend/lib/utils.ts`** - Utility functions
  - BigInt to Uint8Array conversion
  - Other helper functions

## 📋 Interface Definitions

### Candid Interfaces

- **`src/backend/backend.did`** - Backend Candid interface

  - Defines all backend API endpoints
  - Specifies data types and structures

- **`src/backend/declarations/backend.did.d.ts`** - TypeScript bindings

  - Auto-generated TypeScript types
  - Frontend-backend type safety

- **`src/backend/declarations/backend.did.js`** - JavaScript bindings
  - Auto-generated JavaScript interface
  - Used by frontend for API calls

## 📚 Documentation

- **`README.md`** - Project documentation

  - Overview of VetKey features
  - Setup and deployment instructions
  - Technology stack description

- **`use-message-send.tsx.md`** - Message encryption analysis

  - Detailed analysis of principal encryption file
  - Dual encryption strategy explanation

- **`backend-vetkey-analysis.md`** - Backend role analysis
  - Backend responsibilities and limitations
  - Security model explanation

## 🎯 Key Files by Function

### **Encryption Entry Points**

1. **`src/frontend/message/hooks/use-message-send.tsx`** - Main message encryption
2. **`src/frontend/encrypted-notes/hooks/use-notes-save.tsx`** - Note encryption
3. **`src/frontend/timelock/hooks/use-timelock-create.tsx`** - Timelock encryption

### **VetKey Infrastructure**

1. **`src/backend/src/vetkey.rs`** - Core VetKey functionality
2. **`src/backend/src/controller/get_user_key.rs`** - Key derivation
3. **`src/backend/src/controller/get_root_public_key.rs`** - Root key provision

### **Configuration**

1. **`dfx.json`** - Deployment configuration
2. **`src/backend/Cargo.toml`** - Backend dependencies
3. **`package.json`** - Frontend dependencies

## 📊 File Statistics

- **Total VetKey-related files**: ~50 files
- **Backend files**: ~20 files
- **Frontend files**: ~25 files
- **Configuration files**: ~5 files
- **Documentation files**: ~3 files

## 🔍 File Categories Summary

| Category             | Count | Purpose                           |
| -------------------- | ----- | --------------------------------- |
| **Backend Core**     | 3     | VetKey infrastructure and API     |
| **Backend Features** | 15    | Message, Notes, Timelock systems  |
| **Frontend Hooks**   | 12    | React hooks for VetKey operations |
| **Frontend UI**      | 8     | React components and pages        |
| **Frontend State**   | 3     | State management for VetKeys      |
| **Configuration**    | 5     | Build and deployment setup        |
| **Interfaces**       | 3     | Candid and TypeScript bindings    |
| **Documentation**    | 3     | Project and feature documentation |

This comprehensive file structure demonstrates the complete VetKey implementation across both frontend and backend, with clear separation of concerns and proper organization of encryption, storage, and user interface components.
