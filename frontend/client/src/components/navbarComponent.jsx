import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

function NavbarComponent() {
  const [username, setUsername] = useState('');
  const [userRole, setUserRole] = useState(''); // Add state for user role
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        const userResponse = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsername(userResponse.data.name);
        setUserRole(userResponse.data.role); // Set user role
      }
    };

    fetchUser();
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleRedirect = (path) => {
    setIsDropdownOpen(false);
    window.location.href = path;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="app-navbar ">
      <div className="navbar-left">
        <button onClick={toggleDropdown} className="navbar-item text-4xl hover:text-blue-400">
          Menu
        </button>
        {isDropdownOpen && (
          <div className="dropdown-menu">
            <span onClick={() => handleRedirect(userRole === 'teacher' ? '/teacher-dashboard' : '/student-dashboard')} className="dropdown-item">Dashboard</span>
            {userRole === 'teacher' && (
              <>
                <span onClick={() => handleRedirect('/user-management')} className="dropdown-item">Manage users</span>
                <span onClick={() => handleRedirect('/register')} className="dropdown-item">Buat user baru</span>
              </>
            )}
            <span onClick={handleLogout} className="dropdown-item">Logout</span>
          </div>
        )}
      </div>
      <div className="navbar-right text-4xl">
        <h1>{username}</h1>
      </div>
    </nav>
  );
}

export default NavbarComponent;
