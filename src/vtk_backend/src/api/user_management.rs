use crate::{State, UserProfile, CreateUserRequest, UpdateUserRequest, UserResponse, UserListResponse};
use candid::Principal;

pub fn create_user_profile(
    caller: Principal,
    request: CreateUserRequest,
    state: &mut State,
) -> UserResponse {
    // Check if caller is authenticated (not anonymous)
    if caller == Principal::anonymous() {
        return UserResponse::NotAuthenticated;
    }

    // Validate input
    if request.username.trim().is_empty() || request.username.len() > 50 {
        return UserResponse::InvalidInput;
    }

    let username = request.username.trim().to_lowercase();

    // Check if user already exists
    if state.user_profiles.contains_key(&caller) {
        return UserResponse::AlreadyExists;
    }

    // Check if username is already taken
    if state.username_to_principal.contains_key(&username) {
        return UserResponse::AlreadyExists;
    }

    // Create new user profile
    let user_profile = UserProfile {
        principal_id: caller,
        username: username.clone(),
        display_name: request.display_name,
        email: request.email,
        created_at: crate::get_time(),
        last_login: crate::get_time(),
        storage_used: 0,
        file_count: 0,
        is_active: true,
    };

    // Store user profile
    state.user_profiles.insert(caller, user_profile.clone());
    state.username_to_principal.insert(username, caller);
    state.user_count += 1;

    UserResponse::Ok(user_profile)
}

pub fn get_user_profile(caller: Principal, state: &State) -> UserResponse {
    // Check if caller is authenticated (not anonymous)
    if caller == Principal::anonymous() {
        return UserResponse::NotAuthenticated;
    }

    match state.user_profiles.get(&caller) {
        Some(profile) => UserResponse::Ok(profile.clone()),
        None => UserResponse::NotFound,
    }
}

pub fn update_user_profile(
    caller: Principal,
    request: UpdateUserRequest,
    state: &mut State,
) -> UserResponse {
    // Check if caller is authenticated (not anonymous)
    if caller == Principal::anonymous() {
        return UserResponse::NotAuthenticated;
    }

    // Get existing profile
    let mut profile = match state.user_profiles.get(&caller) {
        Some(p) => p.clone(),
        None => return UserResponse::NotFound,
    };

    // Update fields if provided
    if let Some(username) = request.username {
        let username = username.trim().to_lowercase();
        if username.is_empty() || username.len() > 50 {
            return UserResponse::InvalidInput;
        }

        // Check if new username is already taken by someone else
        if let Some(existing_principal) = state.username_to_principal.get(&username) {
            if *existing_principal != caller {
                return UserResponse::AlreadyExists;
            }
        }

        // Remove old username mapping
        state.username_to_principal.remove(&profile.username);
        
        // Update username
        profile.username = username.clone();
        state.username_to_principal.insert(username, caller);
    }

    if let Some(display_name) = request.display_name {
        profile.display_name = Some(display_name);
    }

    if let Some(email) = request.email {
        profile.email = Some(email);
    }

    // Update the profile
    state.user_profiles.insert(caller, profile.clone());

    UserResponse::Ok(profile)
}

pub fn delete_user_profile(caller: Principal, state: &mut State) -> UserResponse {
    // Check if caller is authenticated (not anonymous)
    if caller == Principal::anonymous() {
        return UserResponse::NotAuthenticated;
    }

    // Get existing profile
    let profile = match state.user_profiles.get(&caller) {
        Some(p) => p.clone(),
        None => return UserResponse::NotFound,
    };

    // Remove username mapping
    state.username_to_principal.remove(&profile.username);

    // Remove user profile
    state.user_profiles.remove(&caller);
    state.user_count -= 1;

    // Note: We don't delete user's files here - they should be handled separately
    // to avoid data loss. Files can be cleaned up in a separate operation.

    UserResponse::Ok(profile)
}

pub fn list_users(caller: Principal, state: &State) -> UserListResponse {
    // Check if caller is authenticated (not anonymous)
    if caller == Principal::anonymous() {
        return UserListResponse::NotAuthenticated;
    }

    let users: Vec<UserProfile> = state.user_profiles.values().cloned().collect();
    UserListResponse::Ok(users)
}

pub fn get_user_stats(caller: Principal, state: &State) -> UserResponse {
    // Check if caller is authenticated (not anonymous)
    if caller == Principal::anonymous() {
        return UserResponse::NotAuthenticated;
    }

    let mut profile = match state.user_profiles.get(&caller) {
        Some(p) => p.clone(),
        None => return UserResponse::NotFound,
    };

    // Calculate current stats
    let empty_vec = Vec::new();
    let owned_files = state.file_owners.get(&caller).unwrap_or(&empty_vec);
    let mut total_storage = 0u64;

    for &file_id in owned_files {
        if let Some(file) = state.file_data.get(&file_id) {
            match &file.content {
                crate::FileContent::Uploaded { num_chunks, .. } |
                crate::FileContent::PartiallyUploaded { num_chunks, .. } => {
                    // Calculate storage used by this file
                    for chunk_id in 0..*num_chunks {
                        if let Some(chunk_data) = state.file_contents.get(&(file_id, chunk_id)) {
                            total_storage += chunk_data.len() as u64;
                        }
                    }
                }
                crate::FileContent::Pending { .. } => {
                    // Pending files don't use storage yet
                }
            }
        }
    }

    // Update profile with current stats
    profile.storage_used = total_storage;
    profile.file_count = owned_files.len() as u64;
    profile.last_login = crate::get_time();

    UserResponse::Ok(profile)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::State;

    fn create_test_principal(id: &str) -> Principal {
        Principal::from_text(id).unwrap()
    }

    #[test]
    fn test_create_user_profile() {
        let mut state = State::default();
        let principal = create_test_principal("2vxsx-fae");
        
        let request = CreateUserRequest {
            username: "testuser".to_string(),
            display_name: Some("Test User".to_string()),
            email: Some("test@example.com".to_string()),
        };

        let result = create_user_profile(principal, request, &mut state);
        assert!(matches!(result, UserResponse::Ok(_)));

        if let UserResponse::Ok(profile) = result {
            assert_eq!(profile.principal_id, principal);
            assert_eq!(profile.username, "testuser");
            assert_eq!(profile.display_name, Some("Test User".to_string()));
            assert_eq!(profile.email, Some("test@example.com".to_string()));
            assert!(profile.is_active);
        }
    }

    #[test]
    fn test_anonymous_user_cannot_create_profile() {
        let mut state = State::default();
        let request = CreateUserRequest {
            username: "testuser".to_string(),
            display_name: None,
            email: None,
        };

        let result = create_user_profile(Principal::anonymous(), request, &mut state);
        assert!(matches!(result, UserResponse::NotAuthenticated));
    }

    #[test]
    fn test_duplicate_username_rejected() {
        let mut state = State::default();
        let principal1 = create_test_principal("2vxsx-fae");
        let principal2 = create_test_principal("3vxsx-fae");
        
        let request = CreateUserRequest {
            username: "testuser".to_string(),
            display_name: None,
            email: None,
        };

        // Create first user
        let result1 = create_user_profile(principal1, request.clone(), &mut state);
        assert!(matches!(result1, UserResponse::Ok(_)));

        // Try to create second user with same username
        let result2 = create_user_profile(principal2, request, &mut state);
        assert!(matches!(result2, UserResponse::AlreadyExists));
    }

    #[test]
    fn test_update_user_profile() {
        let mut state = State::default();
        let principal = create_test_principal("2vxsx-fae");
        
        // Create user first
        let create_request = CreateUserRequest {
            username: "testuser".to_string(),
            display_name: Some("Test User".to_string()),
            email: None,
        };
        create_user_profile(principal, create_request, &mut state);

        // Update user
        let update_request = UpdateUserRequest {
            username: Some("newusername".to_string()),
            display_name: Some("New Display Name".to_string()),
            email: Some("new@example.com".to_string()),
        };

        let result = update_user_profile(principal, update_request, &mut state);
        assert!(matches!(result, UserResponse::Ok(_)));

        if let UserResponse::Ok(profile) = result {
            assert_eq!(profile.username, "newusername");
            assert_eq!(profile.display_name, Some("New Display Name".to_string()));
            assert_eq!(profile.email, Some("new@example.com".to_string()));
        }
    }
} 