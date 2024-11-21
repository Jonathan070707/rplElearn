import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      const userResponse = await axios.get('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${response.data.token}`,
        },
      });
      const userRole = userResponse.data.role;
      if (userRole === 'student') {
        navigate('/student-dashboard');
      } else if (userRole === 'teacher') {
        navigate('/teacher-dashboard');
      }
    } catch (error) {
      setError('Invalid email or password');
      console.error('Login failed', error.response ? error.response.data : error.message);
    }
  };

  return (
    <div>
      <h>Login</h>
      <form onSubmit={handleSubmit}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
        <button type="submit">Login</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </div>
  );
}

export default Login;