const express = require('express');
const Enrollment = require('../models/Enrollment');
const Class = require('../models/Class');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.post('/', authenticate('student'), async (req, res) => {
  try {
    const { enrollment_code } = req.body;
    const classDetails = await Class.findOne({ where: { enrollment_code } });
    if (!classDetails) {
      return res.status(404).send({ error: 'Invalid enrollment code' });
    }
    const enrollment = await Enrollment.create({ class_id: classDetails.id, student_id: req.user.id });
    res.status(201).send(enrollment);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get('/:class_id', authenticate('teacher'), async (req, res) => {
  try {
    const enrollments = await Enrollment.findAll({ where: { class_id: req.params.class_id } });
    res.send(enrollments);
  } catch (error) {
    res.status(400).send(error);
  }
});

module.exports = router;