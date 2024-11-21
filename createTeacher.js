
const bcrypt = require('bcryptjs');
const { Teacher } = require('./models');

async function createTeacher() {
  const name = 'Admin';
  const email = 'admin@example.com';
  const password = 'yourpassword';
  const hashedPassword = await bcrypt.hash(password, 10);
  await Teacher.create({ name, email, password: hashedPassword, role: 'teacher' });
  console.log('Teacher account created');
}

createTeacher().catch(console.error);