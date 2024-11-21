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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get('/api/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(response.data);
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
      setSuccessMessage(`Password for ${selectedUserName} changed successfully`);
      setNewPassword('');
      setSelectedUser(null);
      setSelectedUserName(''); // Reset selected user's name
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
        setUsers(users.filter(user => user.id !== userId));
        alert('User deleted successfully');
      } catch (error) {
        console.error('Failed to delete user', error);
      }
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user.id);
    setSelectedUserName(user.name); // Set selected user's name
    setSuccessMessage(''); // Clear success message when selecting a new user
  };

  return (
    <div>
      <h1>User Management</h1>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            {user.name} ({user.role})
            <button onClick={() => handleSelectUser(user)}>Change Password</button>
            <button onClick={() => handleDeleteUser(user.id)}>Delete User</button>
          </li>
        ))}
      </ul>
      {selectedUser && (
        <form onSubmit={handleChangePassword}>
          <p>Changing password for: {selectedUserName}</p> {/* Display the selected user's name */}
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New Password"
            required
          />
          <button type="submit">Change Password</button>
          <button type="button" onClick={() => setSelectedUser(null)}>Cancel</button>
        </form>
      )}
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>} {/* Display success message */}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button onClick={() => navigate(-1)}>Back</button>
    </div>
  );
}

export default UserManagement;