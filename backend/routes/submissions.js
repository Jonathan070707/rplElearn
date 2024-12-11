const express = require('express');
const multer = require('multer');
const path = require('path');
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const Student = require('../models/Student'); // Import Student model
const authenticate = require('../middleware/authenticate');

const router = express.Router();
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|doc|docx|txt/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb('Error: File type not supported!');
    }
  },
});

router.post('/:assignment_id/submit', authenticate('student'), upload.single('file'), async (req, res) => {
  try {
    const assignment = await Assignment.findByPk(req.params.assignment_id);
    if (!assignment) {
      return res.status(404).send({ error: 'Assignment not found' });
    }
    const currentDate = new Date();
    if (currentDate > new Date(assignment.due_date)) {
      return res.status(400).send({ error: 'Submission deadline has passed' });
    }
    const existingSubmission = await Submission.findOne({
      where: { assignment_id: req.params.assignment_id, student_id: req.user.id },
    });
    if (existingSubmission) {
      return res.status(400).send({ error: 'You have already submitted this assignment' });
    }
    const submissionData = {
      student_id: req.user.id,
      assignment_id: req.params.assignment_id,
    };
    if (req.file) {
      submissionData.file_path = req.file.path;
      submissionData.original_file_name = req.file.originalname; // Store original file name
    }
    if (req.body.text) {
      submissionData.text_content = req.body.text;
    }
    if (!req.file && !req.body.text) {
      return res.status(400).send({ error: 'No file or text content provided' });
    }
    const submission = await Submission.create(submissionData);
    res.status(201).send(submission);
  } catch (error) {
    console.error('Failed to submit assignment:', error);
    res.status(500).send({ error: 'Failed to submit assignment' });
  }
});

router.get('/:assignment_id/submissions', authenticate(['teacher', 'student']), async (req, res) => {
  try {
    const whereClause = { assignment_id: req.params.assignment_id };
    if (req.user.role === 'student') {
      whereClause.student_id = req.user.id; // Ensure students only see their own submissions
    }
    const submissions = await Submission.findAll({
      where: whereClause,
      include: [{ model: Student, attributes: ['name'] }], // Include student's name
    });
    res.send(submissions);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get('/student/me', authenticate('student'), async (req, res) => {
  try {
    const submissions = await Submission.findAll({
      where: { student_id: req.user.id },
      include: [{ model: Assignment, attributes: ['title'] }], // Include assignment title
    });
    res.send(submissions);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.put('/:submission_id/edit', authenticate('student'), upload.single('file'), async (req, res) => {
  try {
    const submission = await Submission.findByPk(req.params.submission_id);
    if (!submission) {
      return res.status(404).send({ error: 'Submission not found' });
    }
    if (submission.student_id !== req.user.id) {
      return res.status(403).send({ error: 'Forbidden' });
    }
    const updateData = {};
    if (req.file) {
      updateData.file_path = req.file.path;
      updateData.original_file_name = req.file.originalname; // Store original file name
    }
    if (req.body.text) {
      updateData.text_content = req.body.text;
    }
    if (!req.file && !req.body.text) {
      return res.status(400).send({ error: 'No file or text content provided' });
    }
    await submission.update(updateData);
    res.send(submission);
  } catch (error) {
    console.error('Failed to edit submission:', error);
    res.status(500).send({ error: 'Failed to edit submission' });
  }
});

router.delete('/:submission_id/delete', authenticate('student'), async (req, res) => {
  try {
    const submission = await Submission.findByPk(req.params.submission_id);
    if (!submission) {
      return res.status(404).send({ error: 'Submission not found' });
    }
    if (submission.student_id !== req.user.id) {
      return res.status(403).send({ error: 'Forbidden' });
    }
    await submission.destroy();
    res.send({ message: 'Submission deleted successfully' });
  } catch (error) {
    res.status(400).send(error);
  }
});

router.put('/:submission_id/grade', authenticate('teacher'), async (req, res) => {
  try {
    const submission = await Submission.findByPk(req.params.submission_id);
    if (!submission) {
      return res.status(404).send({ error: 'Submission not found' });
    }
    submission.student_grade = req.body.grade;
    await submission.save();
    res.send(submission);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get('/download/:submission_id', authenticate(['teacher', 'student']), async (req, res) => {
  try {
    const submission = await Submission.findByPk(req.params.submission_id);
    if (!submission) {
      console.error('Submission not found:', req.params.submission_id);
      return res.status(404).send({ error: 'Submission not found' });
    }
    if (req.user.role === 'student' && submission.student_id !== req.user.id) {
      console.error('Forbidden access by student:', req.user.id);
      return res.status(403).send({ error: 'Forbidden' });
    }
    if (!submission.file_path) {
      console.error('No file path found for submission:', req.params.submission_id);
      return res.status(400).send({ error: 'No file path found for submission' });
    }
    const filePath = path.join(__dirname, '..', submission.file_path);
    res.download(filePath, submission.original_file_name, (err) => {
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