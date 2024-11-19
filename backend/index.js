require('dotenv').config(); // Load environment variables
const express = require('express');
const path = require('path');
const sequelize = require('./config/db');
const models = require('./models'); // Import all models
const authRoutes = require('./routes/auth');
const lessonRoutes = require('./routes/lessons');
const assignmentRoutes = require('./routes/assignments');
const submissionRoutes = require('./routes/submissions');
const classRoutes = require('./routes/classes'); // Import classes route
const enrollmentRoutes = require('./routes/enrollments'); // Import enrollments route

const app = express();
const port = 3000;

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/classes', classRoutes); // Use classes route
app.use('/api/enrollments', enrollmentRoutes); // Use enrollments route

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Load JWT_SECRET from config
process.env.JWT_SECRET = require('./config/config.json')[process.env.NODE_ENV || 'development'].jwt_secret;

// Test the database connection and sync models
sequelize.authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
    models.associateModels(); // Call associateModels to set up associations
    return sequelize.sync({ alter: true }); // Ensure the database schema is up-to-date
  })
  .then(() => {
    console.log('Database synchronized.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});