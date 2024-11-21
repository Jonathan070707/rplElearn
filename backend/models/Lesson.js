const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Lesson = sequelize.define('Lesson', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true, // Make optional
  },
  content: {
    type: DataTypes.STRING,
    allowNull: true, // Make optional
  },
  teacher_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  class_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  file_path: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  original_file_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Lesson;