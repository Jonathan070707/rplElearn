const express = require('express');
const bcrypt = require('bcryptjs');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.get('/', authenticate(['teacher']), async (req, res) => {
  try {
    const teachers = await Teacher.findAll();
    const students = await Student.findAll();
    res.send([...teachers, ...students]);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.put('/:user_id/password', authenticate(['teacher', 'student']), async (req, res) => {
  try {
    const { password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    let user = await Student.findByPk(req.params.user_id);
    if (!user) {
      user = await Teacher.findByPk(req.params.user_id);
    }
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }
    await user.update({ password: hashedPassword });
    res.send({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(400).send(error);
  }
});

router.delete('/:user_id', authenticate(['teacher']), async (req, res) => {
  try {
    const user = await Teacher.findByPk(req.params.user_id) || await Student.findByPk(req.params.user_id);
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }
    await user.destroy();
    res.send({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(400).send(error);
  }
});

module.exports = router;