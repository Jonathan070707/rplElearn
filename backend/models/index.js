const Student = require('./Student');
const Teacher = require('./Teacher');
const Lesson = require('./Lesson');
const Assignment = require('./Assignment');
const Submission = require('./Submission');
const Class = require('./Class');
const Enrollment = require('./Enrollment');

// Define relationships
Teacher.hasMany(Lesson, { foreignKey: 'teacher_id' });
Lesson.belongsTo(Teacher, { foreignKey: 'teacher_id' });

Teacher.hasMany(Assignment, { foreignKey: 'teacher_id' });
Assignment.belongsTo(Teacher, { foreignKey: 'teacher_id' });

Assignment.hasMany(Submission, { foreignKey: 'assignment_id' });
Submission.belongsTo(Assignment, { foreignKey: 'assignment_id' });

Student.hasMany(Submission, { foreignKey: 'student_id' });
Submission.belongsTo(Student, { foreignKey: 'student_id' });

Class.hasMany(Enrollment, { foreignKey: 'class_id' });
Enrollment.belongsTo(Class, { foreignKey: 'class_id' });

Student.hasMany(Enrollment, { foreignKey: 'student_id' });
Enrollment.belongsTo(Student, { foreignKey: 'student_id' });

Class.hasMany(Lesson, { foreignKey: 'class_id' });
Lesson.belongsTo(Class, { foreignKey: 'class_id' });

Class.hasMany(Assignment, { foreignKey: 'class_id' });
Assignment.belongsTo(Class, { foreignKey: 'class_id' });

const associateModels = () => {
  Student.associate = models => {
    Student.hasMany(models.Enrollment, { foreignKey: 'student_id' });
    Student.hasMany(models.Submission, { foreignKey: 'student_id' });
  };

  Teacher.associate = models => {
    Teacher.hasMany(models.Lesson, { foreignKey: 'teacher_id' });
    Teacher.hasMany(models.Assignment, { foreignKey: 'teacher_id' });
  };

  Lesson.associate = models => {
    Lesson.belongsTo(models.Teacher, { foreignKey: 'teacher_id' });
    Lesson.belongsTo(models.Class, { foreignKey: 'class_id' });
  };

  Assignment.associate = models => {
    Assignment.belongsTo(models.Teacher, { foreignKey: 'teacher_id' });
    Assignment.belongsTo(models.Class, { foreignKey: 'class_id' });
    Assignment.hasMany(models.Submission, { foreignKey: 'assignment_id' });
  };

  Submission.associate = models => {
    Submission.belongsTo(models.Assignment, { foreignKey: 'assignment_id' });
    Submission.belongsTo(models.Student, { foreignKey: 'student_id' });
  };

  Class.associate = models => {
    Class.hasMany(models.Enrollment, { foreignKey: 'class_id' });
    Class.hasMany(models.Lesson, { foreignKey: 'class_id' });
    Class.hasMany(models.Assignment, { foreignKey: 'class_id' });
  };

  Enrollment.associate = models => {
    Enrollment.belongsTo(models.Class, { foreignKey: 'class_id' });
    Enrollment.belongsTo(models.Student, { foreignKey: 'student_id' });
  };
};

module.exports = {
  Student,
  Teacher,
  Lesson,
  Assignment,
  Submission,
  Class,
  Enrollment,
  associateModels,
};
