const AppError = require('../../shared/errors/AppError');

function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(
      { ...req.body, ...req.params, ...req.query },
      { abortEarly: false, stripUnknown: true }
    );
    if (error) {
      return next(
        AppError.validation('Validation failed', error.details.map((d) => ({ field: d.path.join('.'), message: d.message })))
      );
    }
    req.validated = value;
    next();
  };
}

module.exports = validate;
