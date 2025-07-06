import React, { useState, useEffect } from 'react';
import { UserService } from '../services/userService';
import { UserProfile as UserProfileType, CreateUserRequest, UpdateUserRequest } from '../services/userService';
import { Button } from '@/components/ui/button';

interface UserProfileProps {
  userService: UserService;
  onProfileCreated?: (profile: UserProfileType) => void;
}

export default function UserProfile({ userService, onProfileCreated }: UserProfileProps) {
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state for creating/editing
  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    email: '',
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.getUserProfile();
      
      if (userService.isUserResponseOk(response)) {
        setProfile(response.Ok);
        setIsCreating(false);
      } else if ('NotFound' in response) {
        setIsCreating(true);
      } else {
        setError('Failed to load user profile');
      }
    } catch (err) {
      setError('Error loading user profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const request: CreateUserRequest = {
        username: formData.username.trim(),
        display_name: formData.display_name.trim() ? [formData.display_name.trim()] : [],
        email: formData.email.trim() ? [formData.email.trim()] : [],
      };

      const response = await userService.createUserProfile(request);
      
      if (userService.isUserResponseOk(response)) {
        setProfile(response.Ok);
        setIsCreating(false);
        onProfileCreated?.(response.Ok);
      } else if ('AlreadyExists' in response) {
        setError('Username already exists');
      } else if ('InvalidInput' in response) {
        setError('Invalid input. Username must be between 1-50 characters.');
      } else {
        setError('Failed to create profile');
      }
    } catch (err) {
      setError('Error creating profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const request: UpdateUserRequest = {
        username: formData.username.trim() ? [formData.username.trim()] : [],
        display_name: formData.display_name.trim() ? [formData.display_name.trim()] : [],
        email: formData.email.trim() ? [formData.email.trim()] : [],
      };

      const response = await userService.updateUserProfile(request);
      
      if (userService.isUserResponseOk(response)) {
        setProfile(response.Ok);
        setIsEditing(false);
      } else if ('AlreadyExists' in response) {
        setError('Username already exists');
      } else if ('InvalidInput' in response) {
        setError('Invalid input. Username must be between 1-50 characters.');
      } else {
        setError('Failed to update profile');
      }
    } catch (err) {
      setError('Error updating profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!confirm('Are you sure you want to delete your profile? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await userService.deleteUserProfile();
      
      if (userService.isUserResponseOk(response)) {
        setProfile(null);
        setIsCreating(true);
        setFormData({ username: '', display_name: '', email: '' });
      } else {
        setError('Failed to delete profile');
      }
    } catch (err) {
      setError('Error deleting profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = () => {
    if (profile) {
      setFormData({
        username: profile.username,
        display_name: profile.display_name.length > 0 ? profile.display_name[0] || '' : '',
        email: profile.email.length > 0 ? profile.email[0] || '' : '',
      });
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (isCreating) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Create Profile</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleCreateProfile} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username *
            </label>
            <input
              type="text"
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              maxLength={50}
            />
          </div>

          <div>
            <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <input
              type="text"
              id="display_name"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={100}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Profile'}
          </Button>
        </form>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Profile</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={50}
            />
          </div>

          <div>
            <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <input
              type="text"
              id="display_name"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={100}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-2">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button type="button" onClick={cancelEditing} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">User Profile</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Username</label>
          <p className="text-lg font-semibold text-gray-900">{profile.username}</p>
        </div>

        {profile.display_name.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Display Name</label>
            <p className="text-lg text-gray-900">{profile.display_name[0]}</p>
          </div>
        )}

        {profile.email.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="text-lg text-gray-900">{profile.email[0]}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Storage Used</label>
          <p className="text-lg text-gray-900">{userService.formatStorageSize(profile.storage_used)}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Files</label>
          <p className="text-lg text-gray-900">{Number(profile.file_count)}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Member Since</label>
          <p className="text-lg text-gray-900">{userService.formatTimestamp(profile.created_at)}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Last Login</label>
          <p className="text-lg text-gray-900">{userService.formatTimestamp(profile.last_login)}</p>
        </div>

        <div className="flex space-x-2 pt-4">
          <Button onClick={startEditing} className="flex-1">
            Edit Profile
          </Button>
          <Button onClick={handleDeleteProfile} variant="destructive" className="flex-1">
            Delete Profile
          </Button>
        </div>
      </div>
    </div>
  );
} 