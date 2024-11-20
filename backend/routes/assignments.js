const express = require('express');
const Assignment = require('../models/Assignment');
const Class = require('../models/Class'); // Import Class model
const Enrollment = require('../models/Enrollment'); // Import Enrollment model
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.post('/class/:class_id/assignments', authenticate('teacher'), async (req, res) => {
  try {
    const assignment = await Assignment.create({ ...req.body, class_id: req.params.class_id });
    res.status(201).send(assignment);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.put('/class/:class_id/assignments/:assignment_id', authenticate('teacher'), async (req, res) => {
  try {
    const assignment = await Assignment.findByPk(req.params.assignment_id);
    if (!assignment) {
      return res.status(404).send({ error: 'Assignment not found' });
    }
    const updateData = {};
    if (req.body.title) updateData.title = req.body.title;
    if (req.body.description) updateData.description = req.body.description;
    if (req.body.due_date) updateData.due_date = req.body.due_date;
    await assignment.update(updateData);
    res.send(assignment);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get('/class/:class_id/assignments', authenticate(['teacher', 'student']), async (req, res) => {
  try {
    const assignments = await Assignment.findAll({ where: { class_id: req.params.class_id } });
    res.send(assignments);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get('/student/me', authenticate(['student']), async (req, res) => {
  try {
    const assignments = await Assignment.findAll({
      include: {
        model: Class,
        include: {
          model: Enrollment,
          where: { student_id: req.user.id },
        },
      },
    });
    res.send(assignments);
  } catch (error) {
    console.error('Error fetching assignments for student:', error);
    res.status(400).send(error);
  }
});

router.delete('/class/:class_id/assignments/:assignment_id', authenticate('teacher'), async (req, res) => {
  try {
    const assignment = await Assignment.findByPk(req.params.assignment_id);
    if (!assignment) {
      return res.status(404).send({ error: 'Assignment not found' });
    }
    await assignment.destroy();
    res.send({ message: 'Assignment deleted successfully' });
  } catch (error) {
    res.status(400).send(error);
  }
});

module.exports = router;