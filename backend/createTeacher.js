const bcrypt = require('bcryptjs');
const { Teacher } = require('./models');

async function createTeacher() {
  const name = '2';
  const email = '2@gmail.com';
  const password = '2';
  const hashedPassword = await bcrypt.hash(password, 10);
  await Teacher.create({ name, email, password: hashedPassword, role: 'teacher' });
  console.log('Teacher account created');
}

createTeacher().catch(console.error);