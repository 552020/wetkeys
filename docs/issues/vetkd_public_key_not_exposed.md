# Issue: `vetkd_public_key` Not Exposed to Frontend Actor

## Problem

After updating the backend to expose VetKey methods (`vetkd_public_key`, `vetkd_encrypted_key`) only via wrappers in `main.rs`, and redeploying the canister, the frontend still receives the error:

```
this.actor.vetkd_public_key is not a function
```

## Steps Taken

- Removed duplicate canister method exports for VetKey methods in the backend.
- Successfully built and deployed the backend canister (`dfx deploy`).
- Ran `dfx generate` to update frontend declarations.
- Rebuilt and restarted the frontend.

## Expected Behavior

- The frontend actor should have a callable `vetkd_public_key` method.
- File upload and VetKey test should work without frontend errors.

## Actual Behavior

- The frontend still throws: `this.actor.vetkd_public_key is not a function`.
- The actor object does not have the VetKey methods.

## Possible Causes

- The candid interface may not be updating correctly after deployment.
- The frontend may be using a cached or outdated actor declaration.
- The canister was not fully rebuilt or the frontend is not using the latest generated types.
- There may be a mismatch between the candid interface and the frontend expectations.

## Next Debugging Steps

1. Manually inspect the generated `vtk_backend.did.js` and `index.d.ts` to confirm VetKey methods are present.
2. Check the canister's candid interface via the Candid UI to see if VetKey methods are exposed.
3. Ensure the frontend is importing the correct actor and not a stale or default one.
4. Try a full clean build: remove `src/declarations/vtk_backend`, run `dfx generate`, and restart everything.
5. If the problem persists, consider resetting the dfx environment or checking for dfx version mismatches.

---

**This issue blocks VetKey integration in the frontend.**
