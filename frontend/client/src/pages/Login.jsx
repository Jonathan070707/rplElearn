import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'animate.css';

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
    <div className='custom-gradient-login-bg h-screen'>
        <h1 className='mx-4 text-yellow-500 text-6xl text-center p-5 pt-8 animate__animated animate__fadeInDown font-serif'>Kidemy</h1>
        <h2 className='mx-4 text-white text-5xl p-5 mb-5 text-center animate__animated animate__fadeInUp'>Sign In</h2>
      <div className='flex justify-center items-center'>
        <div className='box-border p-7 bg-white rounded-3xl rounded text-lg animate__animated animate__fadeInUp'>
          <form className='mx-4 p-4 space-y-6 ' onSubmit={handleSubmit}>
            <h1 className='text-indigo-800 text-3xl'>Selamat datang</h1>
            <h2 className='text-gray-500 text-1xl'>Silahkan login untuk lanjut</h2>
            <h3 className='text-indigo-800'> Email</h3>
            <input className='placeholder-gray-500 hover:placeholder-blue-400 border-2 border-grey-500 rounded-lg' type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder=" Masukkan email" required />
            <br ></br>
            <h3 className='text-indigo-800'> Password</h3>
            <input className='placeholder-gray-500 hover:placeholder-blue-400 border-2 border-grey-500 rounded-lg' type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Masukkan password" required />
            <br  />
            <button className='mx-auto text-white box-border h-277 w-40 p-2 rgb(145,143,242) bg-gradient-top-login-button flex flex-col items-center rounded-xl' type="submit">Login</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;