import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student'); // Default to student
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Ensure only teachers can access this page
    const verifyRole = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const userResponse = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (userResponse.data.role !== 'teacher') {
          navigate('/login');
        }
      } catch (error) {
        console.error('Failed to verify user role', error);
        navigate('/login');
      }
    };

    verifyRole();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/auth/register', { name, email, password, role }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Registrasi berhasil');
      setError('');
      // Refresh placeholders
      setName('');
      setEmail('');
      setPassword('');
      setRole('student');
    } catch (error) {
      setError('Registrasi gagal');
      setSuccess('');
      console.error('Registration failed', error);
    }
  };

  return (
    <div className='custom-gradient-login-bg min-h-screen flex flex-col'>
      <h1 className='mx-4 text-yellow-500 text-6xl text-center p-5 pt-8'>Kidemy</h1>
      <h2 className='mx-4 text-white text-5xl p-5 mb-5 text-center'>Register</h2>
      <div className='flex justify-center items-center flex-grow'>
        <div className='box-border w-loginwidthbox p-7 bg-white rounded-3xl rounded text-lg'>
          <form className='mx-4 space-y-6' onSubmit={handleSubmit}>
            <h1 className='text-indigo-800 text-3xl'>Selamat datang</h1>
            <h2 className='text-gray-500 text-1xl'>Silahkan buat akun untuk guru atau murid</h2>
            <h3 className='text-indigo-800'> Name</h3>
            <input className='placeholder-gray-500 hover:placeholder-blue-400 border-2 border-grey-500 rounded-lg' type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Masukkan nama" required />
            <br />
            <h3 className='text-indigo-800'> Email</h3>
            <input className='placeholder-gray-500 hover:placeholder-blue-400 border-2 border-grey-500 rounded-lg' type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Masukkan email" required />
            <br />
            <h3 className='text-indigo-800'> Password</h3>
            <input className='placeholder-gray-500 hover:placeholder-blue-400 border-2 border-grey-500 rounded-lg' type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Masukkan password" required />
            <br />
            <h3 className='text-indigo-800'> Role</h3>
            <select className='placeholder-gray-500 hover:placeholder-blue-400 border-2 border-grey-500 rounded-lg' value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
            <br />
            <button className='mx-auto text-white box-border h-277 w-40 p-2 rgb(145,143,242) bg-gradient-top-login-button flex flex-col items-center rounded-xl' type="submit">Register</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {success && <p style={{ color: 'green' }}>{success}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;