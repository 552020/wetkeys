# Issue: Frontend expects 'hash' field not present in backend or Candid interface

## Error Message

```
Download failed: Cannot find field hash _152860889_
```

## Description

When attempting to download a file, the frontend (or a caller) expects a `hash` field in the file or file metadata record returned from the backend. However, the backend Rust code and the Candid `.did` interface do **not** define a `hash` field in any relevant record (such as `file`, `file_metadata`, or `FileContent`). This results in a Candid deserialization error.

## Analysis

- The `.did` file defines `file` as:
  ```did
  type file = record {
    metadata : file_metadata;
    contents : opt blob;
  };
  ```
- No `hash` field is present in any backend struct or Candid type.
- The error occurs because the frontend or a library is trying to access a `hash` property that does not exist in the response.

## Steps to Reproduce

1. Attempt to download a file from the frontend.
2. Observe the error message about the missing `hash` field.

## Solutions

### Option 1: Remove the expectation from the frontend

- Search the frontend codebase for any usage of `.hash` or `hash` in file download or metadata handling.
- Remove or update code that expects this field.
- Rebuild the frontend.

### Option 2: Add the `hash` field to the backend and Candid interface

- Add a `hash` field to the relevant Rust struct (e.g., `FileData`, `FileContent`, or `file_metadata`).
- Update the `.did` file to include `hash : text;` (or the appropriate type).
- Recompile and redeploy the canister.
- Regenerate Candid bindings and rebuild the frontend.

## Recommendation

- If the `hash` field is not required for your application, **remove the expectation from the frontend**.
- If you need file hashes for integrity or other purposes, **add the field to both backend and Candid**.

## Additional Notes

- This error is a classic Candid/Rust/frontend type mismatch.
- Keeping backend, Candid, and frontend types in sync is critical for smooth operation.
