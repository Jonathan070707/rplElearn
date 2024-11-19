const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Submission = sequelize.define('Submission', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  assignment_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  file_path: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  original_file_name: { // Add original file name field
    type: DataTypes.STRING,
    allowNull: true,
  },
  text_content: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  grade: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  student_grade: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  graded_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  graded_on: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

module.exports = Submission;