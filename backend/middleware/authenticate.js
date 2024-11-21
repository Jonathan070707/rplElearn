const jwt = require('jsonwebtoken');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');

const authenticateToken = () => {
  return async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await (decoded.role === 'teacher' ? Teacher : Student).findByPk(decoded.id);
      if (!user) {
        return res.status(401).send({ error: 'Unauthorized' });
      }
      req.user = user;
      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      res.status(401).send({ error: 'Unauthorized' });
    }
  };
};

module.exports = authenticateToken;