const express = require('express');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');
const Lesson = require('../models/Lesson');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
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

router.put('/:class_id', authenticate(['teacher']), async (req, res) => {
  try {
    const classId = req.params.class_id;
    const classDetails = await Class.findByPk(classId);
    if (!classDetails) {
      return res.status(404).send({ error: 'Class not found' });
    }
    if (classDetails.teacher_id !== req.user.id) {
      return res.status(403).send({ error: 'Forbidden' });
    }
    await classDetails.update({ name: req.body.name });
    res.send(classDetails);
  } catch (error) {
    console.error('Error updating class:', error);
    res.status(400).send(error);
  }
});

router.delete('/:class_id', authenticate(['teacher']), async (req, res) => {
  try {
    const classId = req.params.class_id;
    const classDetails = await Class.findByPk(classId);
    if (!classDetails) {
      return res.status(404).send({ error: 'Class not found' });
    }
    if (classDetails.teacher_id !== req.user.id) {
      return res.status(403).send({ error: 'Forbidden' });
    }
    await classDetails.destroy();
    res.send({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(400).send(error);
  }
});

router.get('/:class_id/grades', authenticate(['teacher', 'student']), async (req, res) => {
  try {
    const classId = req.params.class_id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const classDetails = await Class.findByPk(classId, {
      include: [
        {
          model: Assignment,
          include: [
            {
              model: Submission,
              include: [Student],
            },
          ],
        },
        {
          model: Enrollment,
          include: [Student],
        },
      ],
    });

    if (!classDetails) {
      return res.status(404).send({ error: 'Class not found' });
    }

    let grades = [];

    if (userRole === 'teacher') {
      grades = classDetails.Assignments.map((assignment) => {
        const submissions = assignment.Submissions.map((submission) => ({
          studentId: submission.Student.id,
          studentName: submission.Student.name,
          assignmentId: assignment.id,
          assignmentName: assignment.title,
          grade: submission.student_grade !== null ? submission.student_grade : 'Not Graded',
        }));
        const studentIds = submissions.map(sub => sub.studentId);
        const allStudents = classDetails.Enrollments.map(enrollment => enrollment.Student);
        const missingSubmissions = allStudents.filter(student => !studentIds.includes(student.id)).map(student => ({
          studentId: student.id,
          studentName: student.name,
          assignmentId: assignment.id,
          assignmentName: assignment.title,
          grade: 'Not Submitted',
        }));
        return [...submissions, ...missingSubmissions];
      }).flat();
    } else if (userRole === 'student') {
      grades = classDetails.Assignments.map((assignment) => {
        const submission = assignment.Submissions.find((sub) => sub.student_id === userId);
        return {
          studentId: userId,
          studentName: req.user.name,
          assignmentId: assignment.id,
          assignmentName: assignment.title,
          grade: submission ? (submission.student_grade !== null ? submission.student_grade : 'Not Graded') : 'Not Submitted',
        };
      });
    }

    const groupedGrades = grades.reduce((acc, grade) => {
      const student = acc.find((s) => s.studentId === grade.studentId);
      if (student) {
        student.assignments.push({
          assignmentId: grade.assignmentId,
          assignmentName: grade.assignmentName,
          grade: grade.grade,
        });
        student.totalGrade += grade.grade !== 'Not Graded' && grade.grade !== 'Not Submitted' ? parseFloat(grade.grade) : 0;
        student.assignmentCount += 1; // Always increment assignment count
      } else {
        acc.push({
          studentId: grade.studentId,
          studentName: grade.studentName,
          assignments: [
            {
              assignmentId: grade.assignmentId,
              assignmentName: grade.assignmentName,
              grade: grade.grade,
            },
          ],
          totalGrade: grade.grade !== 'Not Graded' && grade.grade !== 'Not Submitted' ? parseFloat(grade.grade) : 0,
          assignmentCount: 1, // Initialize assignment count to 1
        });
      }
      return acc;
    }, []);

    groupedGrades.forEach(student => {
      const totalAssignments = student.assignmentCount;
      student.totalGrade = totalAssignments > 0 ? (student.totalGrade / totalAssignments).toFixed(2) : 0;
    });

    res.send(groupedGrades);
  } catch (error) {
    console.error('Error fetching grades:', error);
    res.status(400).send(error);
  }
});

module.exports = router;