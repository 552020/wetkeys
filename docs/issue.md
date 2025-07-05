# Issue: dfx generate fails due to missing assetstorage.did for vtk_frontend canister

## Error Message

```
Error: Failed while trying to generate type declarations for 'vtk_frontend'.
Caused by: Candid file: /Users/stefano/Documents/Code/Ethereum/ethglobal_cannes/vtk/.dfx/local/canisters/vtk_frontend/assetstorage.did doesn't exist.
```

## Description

When running `dfx generate` or building the project, the process fails because it cannot find the Candid file `assetstorage.did` for the `vtk_frontend` canister. This blocks type generation and the build process.

## Possible Causes

- The `dfx.json` file includes a canister named `vtk_frontend`, but there is no corresponding `.did` file for it.
- The asset canister for the frontend is being referenced, but its Candid file is missing or not generated.
- The build process is trying to generate types for a canister that does not need them (e.g., the asset canister).

## Steps to Reproduce

1. Run `dfx generate` or `npm run build`.
2. Observe the error about the missing `assetstorage.did` file for `vtk_frontend`.

## Suggested Solutions

- **If the canister is not needed:** Remove the `vtk_frontend` canister entry from `dfx.json`.
- **If the canister is needed:** Ensure that a valid `.did` file exists for the canister at the expected path.
- **If this is the asset canister:** Consider excluding it from type generation, or ensure the build process does not require types for it.

## Additional Notes

- This error is common when the frontend asset canister is included in `dfx.json` but does not have a Candid interface.
- If you need help, paste your `dfx.json` and project structure for further diagnosis.
