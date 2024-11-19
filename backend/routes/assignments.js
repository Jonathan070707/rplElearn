const express = require('express');
const Assignment = require('../models/Assignment');
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
    await assignment.update(req.body);
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