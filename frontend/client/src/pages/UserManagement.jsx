import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [selectedUserName, setSelectedUserName] = useState(''); // Add state for selected user's name
  const [successMessage, setSuccessMessage] = useState(''); // Add state for success message
  const [searchTerm, setSearchTerm] = useState(''); // Add state for search term
  const [searchResult, setSearchResult] = useState([]); // Add state for search result
  const [showSuccessModal, setShowSuccessModal] = useState(false); // Add state for success modal
  const [showFailureModal, setShowFailureModal] = useState(false); // Add state for failure modal
  const [showPasswordChangeSuccessModal, setShowPasswordChangeSuccessModal] = useState(false); // Add state for password change success modal
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get('/api/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(response.data);
        setSearchResult(response.data); // Show all users initially
      } catch (error) {
        console.error('Failed to fetch users', error);
      }
    };

    fetchUsers();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/users/${selectedUser}/password`, { password: newPassword }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNewPassword('');
      setSelectedUser(null);
      setSelectedUserName(''); // Reset selected user's name

      // Update the user list to reflect the change
      const updatedUsers = users.map(user =>
        user.id === selectedUser ? { ...user, password: newPassword } : user
      );
      setUsers(updatedUsers);
      setSearchResult(updatedUsers);
      setShowPasswordChangeSuccessModal(true); // Show password change success modal
      setTimeout(() => setShowPasswordChangeSuccessModal(false), 3000); // Hide after 3 seconds
    } catch (error) {
      setError('Failed to change password');
      console.error('Failed to change password', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const updatedUsers = users.filter(user => user.id !== userId);
        setUsers(updatedUsers);
        setSearchResult(updatedUsers);
        setShowSuccessModal(true); // Show success modal
        setTimeout(() => setShowSuccessModal(false), 3000); // Hide after 3 seconds
      } catch (error) {
        console.error('Failed to delete user', error);
        setShowFailureModal(true); // Show failure modal
        setTimeout(() => setShowFailureModal(false), 3000); // Hide after 3 seconds
      }
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user.id);
    setSelectedUserName(user.name); // Set selected user's name
    setSuccessMessage(''); // Clear success message when selecting a new user
  };

  const handleSearch = (searchTerm) => {
    const filteredUsers = users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) // Filter users by search term
    );
    setSearchResult(filteredUsers);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          handleSearch(e.target.value); // Automatically apply search when typing
        }}
        placeholder="Search users"
        className="border p-2 mb-4 w-full"
      />
      <ul className="space-y-2">
        {searchResult.map(user => (
          <li key={`${user.id}-${user.name}`} className="p-2 border rounded">
            <div className="flex flex-col">
              <span>{user.name} ({user.role})</span>
              <div className="flex justify-start items-center mt-2 space-x-2">
                <button className="bg-blue-500 text-white px-2 py-1 rounded" onClick={() => handleSelectUser(user)}>Change Password</button>
                <button className="bg-red-500 text-white px-2 py-1 rounded" onClick={() => handleDeleteUser(user.id)}>Delete User</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {selectedUser && (
        <form onSubmit={handleChangePassword} className="mt-4">
          <p>Changing password for: {selectedUserName}</p> {/* Display the selected user's name */}
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New Password"
            required
            className="border p-2 mb-2 w-full"
          />
          <div className="flex space-x-2">
            <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">Change Password</button>
            <button type="button" className="bg-gray-500 text-white px-4 py-2 rounded" onClick={() => setSelectedUser(null)}>Cancel</button>
          </div>
        </form>
      )}
      {successMessage && <p className="text-green-500 mt-2">{successMessage}</p>} {/* Display success message */}
      {error && <p className="text-red-500 mt-2">{error}</p>}
      <button className="mt-4 bg-gray-500 text-white px-4 py-2 rounded" onClick={() => navigate(-1)}>Back</button>
      {showPasswordChangeSuccessModal && (
        <div className="fixed bottom-0 left-0 right-0 flex justify-center items-center mb-4">
          <div className="bg-green-500 text-white p-4 rounded animate-slide-up rounded-xl text-2xl">
            Password changed successfully
          </div>
        </div>
      )}
      {showSuccessModal && (
        <div className="fixed bottom-0 left-0 right-0 flex justify-center items-center mb-4">
          <div className="bg-green-500 text-white p-4 rounded animate-slide-up rounded-xl text-2xl">
            User deleted successfully
          </div>
        </div>
      )}
      {showFailureModal && (
        <div className="fixed bottom-0 left-0 right-0 flex justify-center items-center mb-4">
          <div className="bg-red-500 text-white p-4 rounded animate-slide-up rounded-xl text-2xl">
            Failed to delete user
          </div>
        </div>
      )}
      <style>
        {`
          @keyframes slide-up {
            from {
              transform: translateY(100%);
            }
            to {
              transform: translateY(0);
            }
          }
          .animate-slide-up {
            animation: slide-up 0.5s ease-out;
          }
        `}
      </style>
    </div>
  );
}

export default UserManagement;