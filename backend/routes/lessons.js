const express = require('express');
const Lesson = require('../models/Lesson');
const Class = require('../models/Class'); // Import Class model
const Enrollment = require('../models/Enrollment'); // Import Enrollment model
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.post('/class/:class_id/lessons', authenticate('teacher'), async (req, res) => {
  try {
    const lesson = await Lesson.create({ ...req.body, class_id: req.params.class_id });
    res.status(201).send(lesson);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.put('/class/:class_id/lessons/:lesson_id', authenticate('teacher'), async (req, res) => {
  try {
    const lesson = await Lesson.findByPk(req.params.lesson_id);
    if (!lesson) {
      return res.status(404).send({ error: 'Lesson not found' });
    }
    await lesson.update(req.body);
    res.send(lesson);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get('/class/:class_id/lessons', authenticate(['teacher', 'student']), async (req, res) => {
  try {
    const lessons = await Lesson.findAll({ where: { class_id: req.params.class_id } });
    res.send(lessons);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get('/student/me', authenticate(['student']), async (req, res) => {
  try {
    const lessons = await Lesson.findAll({
      include: {
        model: Class,
        include: {
          model: Enrollment,
          where: { student_id: req.user.id },
        },
      },
    });
    res.send(lessons);
  } catch (error) {
    console.error('Error fetching lessons for student:', error);
    res.status(400).send(error);
  }
});

router.delete('/class/:class_id/lessons/:lesson_id', authenticate('teacher'), async (req, res) => {
  try {
    const lesson = await Lesson.findByPk(req.params.lesson_id);
    if (!lesson) {
      return res.status(404).send({ error: 'Lesson not found' });
    }
    await lesson.destroy();
    res.send({ message: 'Lesson deleted successfully' });
  } catch (error) {
    res.status(400).send(error);
  }
});

module.exports = router;