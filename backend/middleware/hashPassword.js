
const bcrypt = require('bcryptjs');

const hashPassword = async (req, res, next) => {
  if (req.body.password) {
    req.body.password = await bcrypt.hash(req.body.password, 10);
  }
  next();
};

module.exports = hashPassword;