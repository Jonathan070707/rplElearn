const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Ensure this matches the secret used during login

const authenticate = (roles) => {
  return (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).send({ error: 'Access denied' });
    }
    const token = authHeader.replace('Bearer ', '');
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token:', decoded); // Add logging
      if (roles && !roles.includes(decoded.role)) {
        console.log('Role mismatch:', decoded.role); // Add logging
        return res.status(403).send({ error: 'Forbidden' });
      }
      req.user = decoded;
      next();
    } catch (err) {
      console.log('Invalid token:', err); // Add logging
      res.status(400).send({ error: 'Invalid token' });
    }
  };
};

module.exports = authenticate;