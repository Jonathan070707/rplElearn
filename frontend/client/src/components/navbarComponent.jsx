import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns-tz';
import 'animate.css';

function NavbarComponent() {
  const [username, setUsername] = useState('');
  const [userRole, setUserRole] = useState(''); // Add state for user role
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
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

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const gmt8Time = format(now, 'yyyy-MM-dd HH:mm:ss', { timeZone: 'Etc/GMT-8' });
      setCurrentTime(gmt8Time);
    };
    updateTime();
    const intervalId = setInterval(updateTime, 1000);
    return () => clearInterval(intervalId);
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
    <>
      <nav className="app-navbar ">
        <div className="navbar-left animate__animated animate__backInDown animate__fast">
          <button onClick={toggleDropdown} className="navbar-item text-4xl hover:text-blue-400">
            MENU
          </button>
          {isDropdownOpen && (
            <div className="dropdown-menu text-xl" style={{ cursor: 'pointer' }}>
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
        <div className="navbar-right text-4xl" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div className="animate__animated animate__backInDown animate__fast" style={{ fontSize: '1rem' }}>
            <span>GMT+8: {currentTime}</span>
          </div>
        </div>
      </nav>
      <div className="center-username text-white custom-gradient-login-bg">
        <h1 className='mx-5 animate__animated animate__backInDown animate__fast'>{username}</h1>
      </div>
    </>
  );
}

export default NavbarComponent;
