const express = require('express');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');
const Lesson = require('../models/Lesson');
const Assignment = require('../models/Assignment');
const authenticate = require('../middleware/authenticate');
const { v4: uuidv4 } = require('uuid'); // Import UUID library

const router = express.Router();

router.post('/', authenticate(['teacher']), async (req, res) => {
  try {
    console.log('Creating class:', req.body);
    const enrollmentCode = uuidv4(); // Generate a unique enrollment code
    const newClass = await Class.create({ ...req.body, enrollment_code: enrollmentCode });
    res.status(201).send(newClass);
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(400).send(error);
  }
});

router.get('/teacher/me', authenticate(['teacher']), async (req, res) => {
  try {
    console.log('Fetching classes for teacher:', req.user.id);
    const classes = await Class.findAll({
      where: { teacher_id: req.user.id },
      attributes: ['id', 'name', 'enrollment_code'], // Include enrollment_code in the response
    });
    res.send(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(400).send(error);
  }
});

router.get('/student/me', authenticate(['student']), async (req, res) => {
  try {
    const classes = await Class.findAll({
      include: {
        model: Enrollment,
        where: { student_id: req.user.id },
      },
    });
    res.send(classes);
  } catch (error) {
    console.error('Error fetching classes for student:', error);
    res.status(400).send(error);
  }
});

router.get('/:class_id', authenticate(['teacher', 'student']), async (req, res) => {
  try {
    console.log('Fetching class details for class_id:', req.params.class_id);
    const classDetails = await Class.findByPk(req.params.class_id, {
      include: [
        { model: Enrollment, include: [Student] },
        { model: Lesson },
        { model: Assignment },
      ],
    });
    if (!classDetails) {
      return res.status(404).send({ error: 'Class not found' });
    }
    if (req.user.role === 'student') {
      const enrollment = await Enrollment.findOne({ where: { class_id: req.params.class_id, student_id: req.user.id } });
      if (!enrollment) {
        return res.status(403).send({ error: 'Forbidden' });
      }
    } else if (req.user.role === 'teacher' && classDetails.teacher_id !== req.user.id) {
      return res.status(403).send({ error: 'Forbidden' });
    }
    res.send(classDetails);
  } catch (error) {
    console.error('Error fetching class details:', error);
    res.status(400).send(error);
  }
});

module.exports = router;