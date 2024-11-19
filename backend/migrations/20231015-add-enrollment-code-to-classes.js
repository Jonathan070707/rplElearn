'use strict';

const { v4: uuidv4 } = require('uuid'); // Import UUID library

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Classes', 'enrollment_code', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      defaultValue: uuidv4(), // Provide a default value
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Classes', 'enrollment_code');
  },
};