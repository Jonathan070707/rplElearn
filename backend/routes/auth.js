const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const hashPassword = require('../middleware/hashPassword');
const authenticateToken = require('../middleware/authenticate'); // Import the authentication middleware

const router = express.Router();

router.post('/register', authenticateToken(), hashPassword, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existingTeachers = await Teacher.count();
    if (existingTeachers > 0 && req.user.role !== 'teacher') {
      return res.status(403).send({ error: 'Only teachers can register new users' });
    }
    console.log('Register attempt:', { name, email, password, role }); // Add logging
    const Model = role === 'teacher' ? Teacher : Student;
    const user = await Model.create({ name, email, password, role });
    console.log('User created:', user); // Add logging
    res.status(201).send(user);
  } catch (error) {
    console.error('Registration error:', error); // Add logging
    res.status(400).send({ error: 'Registration failed', details: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email, password }); // Add logging
    console.log('JWT_SECRET:', process.env.JWT_SECRET); // Verify JWT_SECRET
    const user = await Student.findOne({ where: { email } }) || await Teacher.findOne({ where: { email } });
    if (!user) {
      console.log('Invalid email'); // Add logging
      return res.status(400).send({ error: 'Invalid email' });
    }
    if (!await bcrypt.compare(password, user.password)) {
      console.log('Invalid password'); // Add logging
      return res.status(400).send({ error: 'Invalid password' });
    }
    console.log('User role:', user.role); // Add logging
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('Token generated:', token); // Add logging
    res.send({ token });
  } catch (error) {
    console.error('Login error:', error); // Add logging
    res.status(400).send({ error: 'Login failed', details: error.message });
  }
});

router.get('/me', authenticateToken(), async (req, res) => {
  try {
    const user = req.user.role === 'teacher' 
      ? await Teacher.findByPk(req.user.id) 
      : await Student.findByPk(req.user.id);
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }
    res.send(user);
  } catch (error) {
    res.status(400).send({ error: 'Failed to fetch user details' });
  }
});

module.exports = router;