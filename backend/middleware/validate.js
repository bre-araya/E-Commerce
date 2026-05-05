const { validationResult } = require('express-validator');

// Runs after validation rules — returns errors if any
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg, // Return first error only
      errors:  errors.array(),
    });
  }
  next();
};

module.exports = validate;