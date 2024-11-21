const express = require('express');
const Lesson = require('../models/Lesson');
const Class = require('../models/Class'); // Import Class model
const Enrollment = require('../models/Enrollment'); // Import Enrollment model
const authenticate = require('../middleware/authenticate');
const upload = require('../middleware/upload'); // Import upload middleware
const path = require('path');

const router = express.Router();

router.post('/class/:class_id/lessons', authenticate('teacher'), upload.single('file'), async (req, res) => {
  try {
    const lessonData = {
      ...req.body,
      class_id: req.params.class_id,
      teacher_id: req.user.id,
    };
    if (req.file) {
      lessonData.file_path = req.file.path;
      lessonData.original_file_name = req.file.originalname;
    }
    const lesson = await Lesson.create(lessonData);
    res.status(201).send(lesson);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.put('/class/:class_id/lessons/:lesson_id', authenticate('teacher'), upload.single('file'), async (req, res) => {
  try {
    const lesson = await Lesson.findByPk(req.params.lesson_id);
    if (!lesson) {
      return res.status(404).send({ error: 'Lesson not found' });
    }
    const updateData = { ...req.body };
    if (req.file) {
      updateData.file_path = req.file.path;
      updateData.original_file_name = req.file.originalname;
    }
    await lesson.update(updateData);
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

router.get('/download/:lesson_id', authenticate(['teacher', 'student']), async (req, res) => {
  try {
    const lesson = await Lesson.findByPk(req.params.lesson_id);
    if (!lesson) {
      console.error('Lesson not found:', req.params.lesson_id);
      return res.status(404).send({ error: 'Lesson not found' });
    }
    if (!lesson.file_path) {
      console.error('No file path found for lesson:', req.params.lesson_id);
      return res.status(400).send({ error: 'No file path found for lesson' });
    }
    const filePath = path.resolve(__dirname, '..', lesson.file_path);
    res.download(filePath, lesson.original_file_name, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        res.status(400).send({ error: 'Failed to download file' });
      }
    });
  } catch (error) {
    console.error('Error in file download route:', error);
    res.status(400).send(error);
  }
});

module.exports = router;