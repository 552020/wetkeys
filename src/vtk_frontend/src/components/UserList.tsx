import React, { useState, useEffect } from 'react';
import { UserService } from '../services/userService';
import { UserProfile } from '../services/userService';

interface UserListProps {
  userService: UserService;
}

export default function UserList({ userService }: UserListProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.listUsers();
      
      if (userService.isUserListResponseOk(response)) {
        setUsers(response.Ok);
      } else {
        setError('Failed to load users');
      }
    } catch (err) {
      setError('Error loading users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Users</h2>
        <div className="text-center py-8 text-gray-500">
          No users found.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Users ({users.length})</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <div key={user.principal_id.toString()} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {user.display_name || user.username}
                </h3>
                <p className="text-sm text-gray-500">@{user.username}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {user.email && (
                <div>
                  <span className="text-gray-500">Email:</span>
                  <span className="ml-2 text-gray-900">{user.email}</span>
                </div>
              )}
              
              <div>
                <span className="text-gray-500">Storage:</span>
                <span className="ml-2 text-gray-900">{userService.formatStorageSize(user.storage_used)}</span>
              </div>
              
              <div>
                <span className="text-gray-500">Files:</span>
                <span className="ml-2 text-gray-900">{Number(user.file_count)}</span>
              </div>
              
              <div>
                <span className="text-gray-500">Member since:</span>
                <span className="ml-2 text-gray-900">
                  {userService.formatTimestamp(user.created_at)}
                </span>
              </div>
              
              <div>
                <span className="text-gray-500">Last login:</span>
                <span className="ml-2 text-gray-900">
                  {userService.formatTimestamp(user.last_login)}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className="text-xs text-gray-500">
                  {user.principal_id.toString().slice(0, 8)}...{user.principal_id.toString().slice(-8)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 