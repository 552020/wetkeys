# User Management System Documentation

This document describes the user management system implemented for the VTK file sharing and encryption platform. The system provides comprehensive user profile management with dedicated file structures for each user.

## Overview

The user management system extends the existing file management capabilities by adding:

1. **User Profiles**: Each authenticated user can create and manage their profile
2. **User Data Isolation**: Each user's data is stored in dedicated structures
3. **User Statistics**: Real-time tracking of storage usage and file counts
4. **User Discovery**: Ability to view all users in the system
5. **Profile Management**: Create, read, update, and delete user profiles

## Backend Implementation

### Core Data Structures

#### UserProfile
```rust
pub struct UserProfile {
    pub principal: Principal,           // User's Internet Identity principal
    pub username: String,               // Unique username (lowercase)
    pub display_name: Option<String>,   // Optional display name
    pub email: Option<String>,          // Optional email address
    pub created_at: u64,                // Timestamp when profile was created
    pub last_login: u64,                // Timestamp of last login
    pub storage_used: u64,              // Total storage used in bytes
    pub file_count: u64,                // Number of files owned
    pub is_active: bool,                // Account status
}
```

#### State Extensions
The main `State` struct has been extended with user management fields:

```rust
pub struct State {
    // ... existing fields ...
    
    // User management
    pub user_profiles: BTreeMap<Principal, UserProfile>,
    pub username_to_principal: BTreeMap<String, Principal>, // For username uniqueness
    pub user_count: u64,
}
```

### API Endpoints

#### Create User Profile
- **Endpoint**: `create_user_profile`
- **Type**: Update
- **Request**: `CreateUserRequest`
- **Response**: `UserResponse`
- **Description**: Creates a new user profile for the authenticated caller

#### Get User Profile
- **Endpoint**: `get_user_profile`
- **Type**: Query
- **Request**: None (uses caller principal)
- **Response**: `UserResponse`
- **Description**: Retrieves the current user's profile

#### Update User Profile
- **Endpoint**: `update_user_profile`
- **Type**: Update
- **Request**: `UpdateUserRequest`
- **Response**: `UserResponse`
- **Description**: Updates the current user's profile

#### Delete User Profile
- **Endpoint**: `delete_user_profile`
- **Type**: Update
- **Request**: None (uses caller principal)
- **Response**: `UserResponse`
- **Description**: Deletes the current user's profile

#### List Users
- **Endpoint**: `list_users`
- **Type**: Query
- **Request**: None (uses caller principal)
- **Response**: `UserListResponse`
- **Description**: Lists all users in the system

#### Get User Stats
- **Endpoint**: `get_user_stats`
- **Type**: Query
- **Request**: None (uses caller principal)
- **Response**: `UserResponse`
- **Description**: Gets current user stats with real-time calculations

### Request/Response Types

#### CreateUserRequest
```rust
pub struct CreateUserRequest {
    pub username: String,
    pub display_name: Option<String>,
    pub email: Option<String>,
}
```

#### UpdateUserRequest
```rust
pub struct UpdateUserRequest {
    pub username: Option<String>,
    pub display_name: Option<String>,
    pub email: Option<String>,
}
```

#### UserResponse
```rust
pub enum UserResponse {
    Ok(UserProfile),
    NotFound,
    AlreadyExists,
    InvalidInput,
    NotAuthenticated,
}
```

#### UserListResponse
```rust
pub enum UserListResponse {
    Ok(Vec<UserProfile>),
    NotAuthenticated,
}
```

## Frontend Implementation

### UserService Class

The frontend uses a `UserService` class to interact with the backend:

```typescript
export class UserService {
  constructor(actor: ActorSubclass<_SERVICE>) {
    this.actor = actor;
  }

  async createUserProfile(request: CreateUserRequest): Promise<UserResponse>
  async getUserProfile(): Promise<UserResponse>
  async updateUserProfile(request: UpdateUserRequest): Promise<UserResponse>
  async deleteUserProfile(): Promise<UserResponse>
  async listUsers(): Promise<UserListResponse>
  async getUserStats(): Promise<UserResponse>
  
  // Helper methods
  formatStorageSize(bytes: bigint): string
  formatTimestamp(timestamp: bigint): string
  isUserResponseOk(response: UserResponse): boolean
  isUserListResponseOk(response: UserListResponse): boolean
}
```

### Components

#### UserProfile Component
- **Purpose**: Display and manage individual user profiles
- **Features**:
  - Create new profiles for first-time users
  - Display current profile information
  - Edit profile details
  - Delete profile with confirmation
  - Real-time storage and file statistics

#### UserList Component
- **Purpose**: Display all users in the system
- **Features**:
  - Grid layout of user cards
  - User avatars with initials
  - Storage usage and file count display
  - Account status indicators
  - Truncated principal IDs for privacy

### UI Integration

The main App component has been updated with:

1. **Navigation Tabs**: Files, Profile, Users
2. **User Service Integration**: Automatic initialization with actor
3. **Responsive Design**: Modern UI with Tailwind CSS
4. **Error Handling**: Comprehensive error states and user feedback

## User Data Structure

### File Organization
Each user's data is organized as follows:

```
User Principal (Internet Identity)
├── Profile Information
│   ├── Username (unique)
│   ├── Display Name
│   ├── Email
│   ├── Creation Date
│   ├── Last Login
│   ├── Storage Used
│   └── File Count
├── Owned Files
│   ├── File Metadata
│   ├── File Content (chunked)
│   └── File Permissions
└── User Statistics
    ├── Real-time Storage Calculation
    └── File Count Tracking
```

### Data Isolation
- **Principal-based Access**: All operations require authentication
- **Ownership Tracking**: Files are linked to user principals
- **Username Uniqueness**: Enforced at the backend level
- **Privacy Protection**: Principal IDs are truncated in UI

## Security Features

### Authentication Requirements
- All user management operations require authentication
- Anonymous users cannot access user management features
- Principal-based access control for all operations

### Data Validation
- Username length limits (1-50 characters)
- Email format validation
- Input sanitization and trimming
- Duplicate username prevention

### Privacy Protection
- Principal IDs are truncated in UI displays
- User lists show minimal identifying information
- Profile deletion requires confirmation

## Usage Examples

### Creating a User Profile
```typescript
const userService = new UserService(actor);
const response = await userService.createUserProfile({
  username: "john_doe",
  display_name: "John Doe",
  email: "john@example.com"
});

if (userService.isUserResponseOk(response)) {
  console.log("Profile created:", response.Ok);
}
```

### Updating a Profile
```typescript
const response = await userService.updateUserProfile({
  display_name: "John Smith",
  email: "johnsmith@example.com"
});
```

### Getting User Statistics
```typescript
const response = await userService.getUserStats();
if (userService.isUserResponseOk(response)) {
  const profile = response.Ok;
  console.log(`Storage used: ${userService.formatStorageSize(profile.storage_used)}`);
  console.log(`Files: ${Number(profile.file_count)}`);
}
```

## Error Handling

### Common Error Scenarios
1. **NotAuthenticated**: User is not logged in
2. **NotFound**: User profile doesn't exist
3. **AlreadyExists**: Username is already taken
4. **InvalidInput**: Input validation failed

### Frontend Error Display
- Error messages are displayed in red alert boxes
- Loading states prevent multiple submissions
- Form validation provides immediate feedback
- Confirmation dialogs for destructive actions

## Testing

### Backend Tests
The user management API includes comprehensive tests:

- User profile creation and validation
- Username uniqueness enforcement
- Authentication requirements
- Profile update operations
- Error handling scenarios

### Frontend Tests
- Component rendering and state management
- Form validation and submission
- Error handling and display
- User service integration

## Future Enhancements

### Planned Features
1. **User Roles**: Admin, moderator, regular user roles
2. **File Sharing**: Direct file sharing between users
3. **User Groups**: Group-based file organization
4. **Activity Logs**: User activity tracking
5. **Storage Quotas**: Configurable storage limits
6. **Profile Pictures**: Avatar upload and management

### Technical Improvements
1. **Caching**: Client-side caching for better performance
2. **Real-time Updates**: WebSocket integration for live updates
3. **Advanced Search**: User search and filtering
4. **Bulk Operations**: Batch user management operations
5. **Export/Import**: User data export capabilities

## Integration with Existing System

### File Management Integration
- User profiles are automatically linked to file ownership
- Storage calculations include all user files
- File operations respect user authentication
- User deletion preserves file data (configurable)

### Authentication Integration
- Seamless integration with Internet Identity
- Principal-based user identification
- Automatic profile creation workflow
- Session management and persistence

This user management system provides a solid foundation for user-centric file management while maintaining the security and privacy requirements of the VTK platform. 